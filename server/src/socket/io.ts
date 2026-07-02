import { Server } from 'socket.io'

let io: Server

export const initIO = (serverIO: Server) => {
    io = serverIO
}

export const getIO = (): Server => {
    if (!io) throw new Error('Socket.IO not initialized — call initIO() first')
    return io
}