import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

import { User } from '../models/user.model'
import { Room } from '../models/room.model'
import { Shape } from '../models/shape.model'

interface AuthSocket extends Socket {
    userId?: string
    displayName: string
    roomCode?: string
}

interface  JoinRoomPayload { roomCode: string } 
interface CursorPayload { x: number; y: number }

interface DrawShapePayload {
    tempId: string
    shapeType: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text'
    data: {
        points?: { x: number; y: number }[]
        x?:       number
        y?:       number
        width?:   number
        height?:  number
        text?:    string
        strokeColor?: string
        strokeWidth?: number
        fillColor?:   string
    }
}

interface MoveShapePayload {
    shapeId: string
    dx: number
    dy: number
}

async function authenticateSocket(socket: AuthSocket, next: (err?: Error) => void) {
    const { token, displayName } = socket.handshake.auth as {
        token?: string
        displayName?: string
    }
 
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
            const user = await User.findById(decoded.id).select('name')
            if (!user) return next(new Error('AUTH_FAILED'))
 
            socket.userId = user._id.toString()
            socket.displayName = user.name
            return next()
        } catch {
            return next(new Error('AUTH_FAILED'))
        }
    }
 
    if (displayName?.trim()) {
        socket.displayName = displayName.trim()
        return next()
    }
 
    return next(new Error('Provide a token or displayName'))
}

const guestUndoStack = new Map<string, string[]>()

export function registerSocketHandlers(io: Server) {
    io.use((socket, next) => authenticateSocket(socket as AuthSocket, next))

    io.on('connection', (raw: Socket) => {
        const socket = raw as AuthSocket
        console.log(`[ws] + ${socket.id} (${socket.displayName})`)

        socket.on('join-room', async ({ roomCode }: JoinRoomPayload) => {
            const room = await Room.findOne({ roomCode })
            if (!room) {
                socket.emit('error', { message: 'Room not found '})
                return
            }

            if (!room.isPublic) {
                const isOwner = socket.userId && room.ownerId.toString() === socket.userId
                if (!isOwner) {
                    socket.emit('error', { message: 'Room is private' })
                    return
                }
            }

            socket.roomCode = roomCode
            await socket.join(roomCode)

            socket.to(roomCode).emit('user-joined', {
                socketId: socket.id,
                displayName: socket.displayName,
                userId: socket.userId ?? null,
            })

            const socketInRoom = await io.in(roomCode).fetchSockets()
            const onlineUsers = socketInRoom.filter(s => s.id !== socket.id).map(s => ({
                socketId: s.id,
                displayName: (s as unknown as AuthSocket).displayName,
                userId: (s as unknown as AuthSocket).userId ?? null,
            }))

            const shapes = await Shape.find({ roomId: room._id, isDeleted: false }).sort({ createdAt: 1 }).lean()

            socket.emit('room-joined', { onlineUsers, shapes })
        })

        socket.on('cursor-move', (payload: CursorPayload) => {
            if (!socket.roomCode) return

            socket.to(socket.roomCode).emit('cursor-update', {
                socketId: socket.id,
                displayId: socket.id,
                displayName: socket.displayName,
                x: payload.x,
                y: payload.y
            })
        })

        socket.on('draw-shape', async (payload: DrawShapePayload) => {
            if (!socket.roomCode) return

            try {
                const room = await Room.findOne({ code: socket.roomCode })
                if (!room) return

                const shape = await Shape.create({
                    roomId: room._id,
                    userId: socket.userId ?? null,
                    shapeId: payload.shapeType,
                    data: payload.data
                })

                if (!socket.userId) {
                    const stack = guestUndoStack.get(socket.id) ?? []
                    stack.push(shape._id.toString())
                    guestUndoStack.set(socket.id, stack)
                }


                io.to(socket.roomCode).emit('shape-added', {
                    shape: shape.toObject(),
                    tempId: payload.tempId,
                })

            } catch (err) {
                console.error('[ws] draw-shape error: ', err)
                socket.emit('error', { message: 'Failed to save shape'})
            }
        })

        socket.on('move-shape', async (payload: MoveShapePayload) => {
            if (!socket.roomCode) return 

            try {
                const shape = await Shape.findById(payload.shapeId)
                if (!shape || shape.isDeleted) return

                if (shape.data) {
                    if (shape.data.points && shape.data.points.length > 0) {
                        shape.data.points = shape.data.points.map(p => ({
                            x: (p?.x ?? 0) + payload.dx,
                            y: (p?.y ?? 0) + payload.dy
                        })) as any
                    }

                    if (shape.data.x !== undefined && shape.data.x !== null) {
                        shape.data.x += payload.dx
                    }
                    if (shape.data.y !== undefined && shape.data.y !== null) {
                        shape.data.y += payload.dy
                    }
                }
 
                shape.markModified('data')
                await shape.save()
 
                io.to(socket.roomCode).emit('shape-moved', {
                    shape: shape.toObject(),
                })
            } catch (err) {
                console.error('[ws] move-shape error:', err)
                socket.emit('error', { message: 'Failed to move shape' })
            }
        })

        socket.on('undo', async () => {
            if (!socket.roomCode) return
 
            try {
                const room = await Room.findOne({ code: socket.roomCode })
                if (!room) return
 
                let shapeId: string | undefined
 
                if (socket.userId) {
                    const shape = await Shape.findOne({
                        roomId:    room._id,
                        userId:    socket.userId,
                        isDeleted: false,
                    }).sort({ createdAt: -1 })
 
                    shapeId = shape?._id.toString()
                } else {
                    const stack = guestUndoStack.get(socket.id) ?? []
                    shapeId = stack.pop()
                    guestUndoStack.set(socket.id, stack)
                }
 
                if (!shapeId) return
 
                await Shape.findByIdAndUpdate(shapeId, { isDeleted: true })
 
                io.to(socket.roomCode).emit('shape-removed', { shapeId })
            } catch (err) {
                console.error('[ws] undo error:', err)
            }
        })

        socket.on('disconnect', () => {
            console.log(`[ws] - ${socket.id}  (${socket.displayName})`)
 
            guestUndoStack.delete(socket.id)
 
            if (socket.roomCode) {
                socket.to(socket.roomCode).emit('user-left', {
                    socketId:    socket.id,
                    displayName: socket.displayName,
                })
            }
        })
    })
}
