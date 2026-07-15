import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

import type { Point, ShapeData, Shape, OnlineUser } from '../types/whiteboard'
import { drawShape, drawSelectionBoundingBox } from '../utils/canvas'
import { findHitShape } from '../utils/hitTest'

const colors = [
    { value: '#1a1a1a', label: 'Charcoal' },
    { value: '#2563eb', label: 'Blue' },
    { value: '#dc2626', label: 'Red' },
    { value: '#16a34a', label: 'Green' },
    { value: '#ea580c', label: 'Orange' },
    { value: '#9333ea', label: 'Purple' },
    { value: '#ffffff', label: 'White' }
]

const strokeWidths = [
    { value: 2, label: 'Thin' },
    { value: 4, label: 'Medium' },
    { value: 7, label: 'Thick' }
]

const toolsList = [
    { tool: 'select', label: 'Select & Move', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg> },
    { tool: 'pen', label: 'Freehand Pen', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    { tool: 'line', label: 'Straight Line', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/></svg> },
    { tool: 'arrow', label: 'Arrow Direction', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg> },
    { tool: 'rectangle', label: 'Rectangle Shape', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> },
    { tool: 'circle', label: 'Circle / Ellipse', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> },
    { tool: 'text', label: 'Add Text Box', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
    { tool: 'eraser', label: 'Eraser Tool', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.5l12-12c1.1-1.1 2.9-1.1 4 0l4.3 4.3c1 1 1 2.5 0 3.5l-12 12c-1.1 1.1-2.9 1.1-4 0z"/><path d="m22 21h-8"/><path d="m14 11 5 5"/></svg> },
] as const

export default function RoomPage() {
    const { code } = useParams<{ code: string }>()
    const navigate = useNavigate()
    const { user, token } = useAuthStore()

    // Room info
    const [roomName, setRoomName] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Guest Auth
    const [displayName, setDisplayName] = useState(() => localStorage.getItem('guest_name') || '')
    const [guestNameInput, setGuestNameInput] = useState('')
    const [showNamePrompt, setShowNamePrompt] = useState(false)

    // Interactive States
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [shapes, setShapes] = useState<Shape[]>([])
    const [currentTool, setCurrentTool] = useState<'select' | 'pen' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'text' | 'eraser'>('pen')
    const [strokeColor, setStrokeColor] = useState('#1a1a1a')
    const [strokeWidth, setStrokeWidth] = useState(2)
    const [fillColor, setFillColor] = useState<'transparent' | 'solid'>('transparent')
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
    const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null)
    const [cursors, setCursors] = useState<Record<string, { x: number; y: number; displayName: string }>>({})

    // Canvas & Socket Refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const socketRef = useRef<import('socket.io-client').Socket | null>(null)
    const lastEmitCursor = useRef(0)
    const isDrawing = useRef(false)
    const startPoint = useRef<Point | null>(null)
    const currentPoints = useRef<Point[]>([])
    const draggedShape = useRef<Shape | null>(null)
    const dragStart = useRef<Point | null>(null)
    const totalDx = useRef(0)
    const totalDy = useRef(0)
    const [activeShape, setActiveShape] = useState<Partial<Shape> | null>(null)

    // Fetch Room Data
    useEffect(() => {
        const fetchRoom = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await api.get(`/room/${code}`)
                const room = res.data.data
                setRoomName(room.name)

                // Check ownership
                if (user && room.ownerId?._id === user._id) {
                    setIsOwner(true)
                }

                // If not logged in, prompt guest name
                if (!user && !displayName) {
                    setShowNamePrompt(true)
                }
            } catch (err) {
                const e = err as { response?: { data?: { message?: string } } }
                setError(e.response?.data?.message || 'Room not found or private')
            } finally {
                setLoading(false)
            }
        }
        if (code) fetchRoom()
    }, [code, user, displayName])

    // Establish WebSocket Connection
    useEffect(() => {
        if (loading || error) return
        if (!user && !displayName) return // Wait for guest display name

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const serverUrl = apiUrl.replace('/api', '')

        const socket = io(serverUrl, {
            auth: {
                token: token || undefined,
                displayName: user ? undefined : displayName
            }
        })
        socketRef.current = socket

        // Join room roomCode
        socket.emit('join-room', { roomCode: code })

        // WS Listeners
        socket.on('room-joined', ({ onlineUsers, shapes }: { onlineUsers: OnlineUser[]; shapes: Shape[] }) => {
            setOnlineUsers(onlineUsers)
            setShapes(shapes)
        })

        socket.on('user-joined', (newUser: OnlineUser) => {
            setOnlineUsers(prev => {
                if (prev.some(u => u.socketId === newUser.socketId)) return prev
                return [...prev, newUser]
            })
        })

        socket.on('user-left', ({ socketId }: { socketId: string }) => {
            setOnlineUsers(prev => prev.filter(u => u.socketId !== socketId))
            setCursors(prev => {
                const next = { ...prev }
                delete next[socketId]
                return next
            })
        })

        socket.on('cursor-update', (cursor: { socketId: string; displayName: string; x: number; y: number }) => {
            setCursors(prev => ({
                ...prev,
                [cursor.socketId]: {
                    x: cursor.x,
                    y: cursor.y,
                    displayName: cursor.displayName
                }
            }))
        })

        socket.on('shape-added', ({ shape, tempId }: { shape: Shape; tempId: string }) => {
            setShapes(prev => {
                const idx = prev.findIndex(s => s._id === tempId)
                if (idx !== -1) {
                    const copy = [...prev]
                    copy[idx] = shape
                    return copy
                }
                if (prev.some(s => s._id === shape._id)) return prev
                return [...prev, shape]
            })
        })

        socket.on('shape-moved', ({ shape }: { shape: Shape }) => {
            setShapes(prev => prev.map(s => s._id === shape._id ? shape : s))
        })

        socket.on('shape-removed', ({ shapeId }: { shapeId: string }) => {
            setShapes(prev => prev.filter(s => s._id !== shapeId))
            setSelectedShapeId(prev => prev === shapeId ? null : prev)
        })

        socket.on('canvas-cleared', () => {
            setShapes([])
            setSelectedShapeId(null)
        })

        socket.on('room-deleted', ({ message }: { message: string }) => {
            toast.success(message || 'The room has been deleted.')
            navigate('/')
        })

        socket.on('error', (err: { message: string }) => {
            console.error('[ws] error:', err.message)
        })

        return () => {
            socket.disconnect()
        }
    }, [loading, error, displayName, code, user, token, navigate])

    // Render Canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw established shape elements
        shapes.forEach(shape => drawShape(ctx, shape))

        // Draw active overlay during drag/freehand
        if (activeShape) {
            drawShape(ctx, activeShape)
        }

        // Draw bounding box selection outlines
        if (currentTool === 'select' && selectedShapeId) {
            const sel = shapes.find(s => s._id === selectedShapeId)
            if (sel) {
                drawSelectionBoundingBox(ctx, sel)
            }
        }
    }, [shapes, activeShape, currentTool, selectedShapeId])

    // Auto resize and draw
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const handleResize = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
            draw()
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [draw])

    // Redraw whenever shape states modify
    useEffect(() => {
        draw()
    }, [draw])

    // Get Mouse Canvas Relative Coordinates
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e)

        if (currentTool === 'eraser') {
            const hit = findHitShape(shapes, coords.x, coords.y)
            if (hit) {
                socketRef.current?.emit('delete-shape', { shapeId: hit._id })
                setShapes(prev => prev.filter(s => s._id !== hit._id))
                setSelectedShapeId(null)
            }
            return
        }

        if (currentTool === 'text') {
            return
        }

        if (currentTool === 'select') {
            const hit = findHitShape(shapes, coords.x, coords.y)
            if (hit) {
                draggedShape.current = hit
                dragStart.current = { x: e.clientX, y: e.clientY }
                totalDx.current = 0
                totalDy.current = 0
                setSelectedShapeId(hit._id)
                isDrawing.current = true
            } else {
                setSelectedShapeId(null)
            }
            return
        }

        isDrawing.current = true
        startPoint.current = coords
        if (currentTool === 'pen') {
            currentPoints.current = [coords]
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e)

        // Throttle cursor emit
        const now = Date.now()
        if (now - lastEmitCursor.current > 40) {
            socketRef.current?.emit('cursor-move', { x: coords.x, y: coords.y })
            lastEmitCursor.current = now
        }

        if (!isDrawing.current) return

        if (currentTool === 'select' && draggedShape.current && dragStart.current) {
            const dx = e.clientX - dragStart.current.x
            const dy = e.clientY - dragStart.current.y
            dragStart.current = { x: e.clientX, y: e.clientY }
            totalDx.current += dx
            totalDy.current += dy

            setShapes(prev => prev.map(s => {
                if (s._id === draggedShape.current!._id) {
                    const copy = { ...s }
                    if (s.shapeId === 'pen') {
                        copy.data = {
                            ...s.data,
                            points: s.data.points?.map(p => ({ x: p.x + dx, y: p.y + dy }))
                        }
                    } else {
                        copy.data = {
                            ...s.data,
                            x: (s.data.x ?? 0) + dx,
                            y: (s.data.y ?? 0) + dy
                        }
                    }
                    return copy
                }
                return s
            }))
            return
        }

        if (!startPoint.current) return

        const w = coords.x - startPoint.current.x
        const h = coords.y - startPoint.current.y

        if (currentTool === 'pen') {
            currentPoints.current.push(coords)
            setActiveShape({
                shapeId: 'pen',
                data: {
                    points: [...currentPoints.current],
                    strokeColor,
                    strokeWidth
                }
            })
        } else {
            setActiveShape({
                shapeId: currentTool as Shape['shapeId'],
                data: {
                    x: startPoint.current.x,
                    y: startPoint.current.y,
                    width: w,
                    height: h,
                    strokeColor,
                    strokeWidth,
                    fillColor: fillColor === 'solid' ? (strokeColor + '20') : 'transparent'
                }
            })
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (currentTool === 'text') {
            if (textInput && textInput.value.trim()) {
                handleCommitText()
            }
            const coords = getCanvasCoords(e)
            setTextInput({ x: coords.x, y: coords.y, value: '' })
            return
        }

        if (!isDrawing.current) return
        isDrawing.current = false

        const coords = getCanvasCoords(e)

        if (currentTool === 'select' && draggedShape.current) {
            if (totalDx.current !== 0 || totalDy.current !== 0) {
                socketRef.current?.emit('move-shape', {
                    shapeId: draggedShape.current._id,
                    dx: totalDx.current,
                    dy: totalDy.current
                })
            }
            draggedShape.current = null
            dragStart.current = null
            return
        }

        if (!startPoint.current) return

        const tempId = crypto.randomUUID()
        const w = coords.x - startPoint.current.x
        const h = coords.y - startPoint.current.y

        const data: ShapeData = {
            strokeColor,
            strokeWidth
        }

        if (currentTool === 'pen') {
            data.points = [...currentPoints.current]
        } else {
            data.x = startPoint.current.x
            data.y = startPoint.current.y
            data.width = w
            data.height = h
            if (currentTool === 'rectangle' || currentTool === 'circle') {
                data.fillColor = fillColor === 'solid' ? (strokeColor + '20') : 'transparent'
            }
        }

        const payload = {
            tempId,
            shapeType: currentTool as Shape['shapeId'],
            data
        }

        socketRef.current?.emit('draw-shape', payload)

        // Optimistic local add
        const newShape: Shape = {
            _id: tempId,
            roomId: '',
            userId: null,
            shapeId: currentTool as Shape['shapeId'],
            data,
            isDeleted: false
        }
        setShapes(prev => [...prev, newShape])

        startPoint.current = null
        currentPoints.current = []
        setActiveShape(null)
    }

    const handleCommitText = () => {
        if (!textInput) return
        const val = textInput.value.trim()
        if (val) {
            const tempId = crypto.randomUUID()
            const payload = {
                tempId,
                shapeType: 'text' as const,
                data: {
                    x: textInput.x,
                    y: textInput.y,
                    text: val,
                    strokeColor,
                    strokeWidth
                }
            }

            socketRef.current?.emit('draw-shape', payload)

            const newShape: Shape = {
                _id: tempId,
                roomId: '',
                userId: null,
                shapeId: 'text' as const,
                data: payload.data,
                isDeleted: false
            }
            setShapes(prev => [...prev, newShape])
        }
        setTextInput(null)
    }

    // Actions
    const handleUndo = () => {
        socketRef.current?.emit('undo')
    }

    // Keyboard Shortcuts (Undo) relocation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                handleUndo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleClearCanvas = async () => {
        if (!confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) return
        try {
            await api.delete(`/room/${code}/clear`)
            toast.success('Canvas cleared!')
        } catch (err) {
            console.error('Failed to clear canvas', err)
            toast.error('Failed to clear canvas')
        }
    }

    const handleDeleteRoom = async () => {
        if (!confirm('Are you sure you want to delete this room? Everyone will be booted.')) return
        try {
            await api.delete(`/room/${code}`)
            toast.success('Room deleted!')
        } catch (err) {
            console.error('Failed to delete room', err)
            toast.error('Failed to delete room')
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Room URL copied to clipboard!')
    }

    const handleExport = async () => {
        const canvas = canvasRef.current
        if (!canvas) return

        try {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = canvas.width
            tempCanvas.height = canvas.height
            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) return

            const isDark = document.documentElement.classList.contains('dark')
            tempCtx.fillStyle = isDark ? '#0a0a0a' : '#ffffff'
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

            tempCtx.drawImage(canvas, 0, 0)

            const filename = `${roomName.replace(/\s+/g, '_') || 'whiteboard'}-${code}.png`

            if ('showSaveFilePicker' in window) {
                const blob = await new Promise<Blob | null>((resolve) => tempCanvas.toBlob(resolve, 'image/png'))
                if (!blob) throw new Error('Blob creation failed')

                const handle = await (window as unknown as {
                    showSaveFilePicker: (options: object) => Promise<{
                        createWritable: () => Promise<{
                            write: (blob: Blob) => Promise<void>
                            close: () => Promise<void>
                        }>
                    }>
                }).showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PNG Image',
                        accept: { 'image/png': ['.png'] }
                    }]
                })
                const writable = await handle.createWritable()
                await writable.write(blob)
                await writable.close()

                toast.success('Whiteboard saved successfully!')
            } else {
                const dataUrl = tempCanvas.toDataURL('image/png')
                const link = document.createElement('a')
                link.download = filename
                link.href = dataUrl
                link.click()

                toast.success('Whiteboard exported as PNG!')
            }
        } catch (err) {
            // Silence user cancel abort errors
            if (err instanceof Error && err.name === 'AbortError') {
                return
            }
            console.error('Failed to export canvas', err)
            toast.error('Failed to export canvas')
        }
    }

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = guestNameInput.trim()
        if (!trimmed) return
        localStorage.setItem('guest_name', trimmed)
        setDisplayName(trimmed)
        setShowNamePrompt(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
                <p className="text-neutral-500 dark:text-neutral-400 animate-pulse text-sm">Loading room...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 p-6 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
                    Access Denied
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-6">
                    {error}
                </p>
                <Link to="/" className="text-sm font-medium px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90">
                    Go Back Home
                </Link>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-white dark:bg-neutral-950 overflow-hidden relative select-none">
            {/* Header controls bar */}
            <header className="absolute top-4 left-4 right-4 z-20 h-14 flex items-center justify-between px-4 bg-neutral-50/90 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-card dark:shadow-card-dark">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </Link>
                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                    <div>
                        <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {roomName}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collaborative Users Bubbles */}
                    <div className="flex items-center -space-x-1.5 mr-2">
                        {onlineUsers.slice(0, 4).map((u) => (
                            <div 
                                key={u.socketId}
                                title={u.displayName}
                                className="w-7 h-7 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase cursor-default"
                            >
                                {u.displayName[0]}
                            </div>
                        ))}
                        {onlineUsers.length > 4 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-bold">
                                +{onlineUsers.length - 4}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleShare}
                        className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        Share
                    </button>

                    <button 
                        onClick={handleExport}
                        className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Export Board as PNG"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export
                    </button>

                    {isOwner && (
                        <>
                            <button 
                                onClick={handleClearCanvas}
                                title="Clear entire whiteboard"
                                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </button>
                            <button 
                                onClick={handleDeleteRoom}
                                title="Delete room permanently"
                                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Left toolbar floating */}
            <aside className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-2 bg-neutral-50/90 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-card dark:shadow-card-dark">
                {toolsList.map((item) => (
                    <button
                        key={item.tool}
                        onClick={() => {
                            setCurrentTool(item.tool)
                            setSelectedShapeId(null)
                        }}
                        title={item.label}
                        className={`p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                            currentTool === item.tool
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        {item.icon}
                    </button>
                ))}
            </aside>

            {/* Right toolbar panel for styling */}
            <aside className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 p-4 bg-neutral-50/90 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-card dark:shadow-card-dark w-40">
                <div>
                    <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Colors</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setStrokeColor(c.value)}
                                title={c.label}
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                    strokeColor === c.value
                                        ? 'border-neutral-900 dark:border-white scale-110 shadow-sm'
                                        : c.value === '#ffffff'
                                            ? 'border-neutral-200 dark:border-neutral-800 hover:scale-105'
                                            : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                    </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800" />

                <div>
                    <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Thickness</h3>
                    <div className="flex gap-1.5">
                        {strokeWidths.map((w) => (
                            <button
                                key={w.value}
                                onClick={() => setStrokeWidth(w.value)}
                                className={`flex-1 text-xs py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                    strokeWidth === w.value
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                            >
                                {w.label[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {(currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'select') && (
                    <>
                        <div className="border-t border-neutral-200 dark:border-neutral-800" />
                        <div>
                            <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Fill Area</h3>
                            <div className="flex gap-1.5">
                                {[
                                    { value: 'transparent', label: 'Hollow' },
                                    { value: 'solid', label: 'Solid' }
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setFillColor(item.value as 'transparent' | 'solid')}
                                        className={`flex-1 text-xs py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                            fillColor === item.value
                                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="border-t border-neutral-200 dark:border-neutral-800" />

                <button 
                    onClick={handleUndo}
                    className="w-full text-xs py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    Undo
                </button>
            </aside>

            {/* Main Interactive Canvas Wrapper */}
            <main className="h-full w-full relative bg-dot-grid">
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="absolute inset-0 cursor-crosshair block"
                />

                {/* Text editor input box overlay */}
                {textInput && (
                    <textarea
                        value={textInput.value}
                        onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                        onBlur={handleCommitText}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleCommitText()
                            }
                        }}
                        className="absolute bg-white/95 dark:bg-neutral-900/95 border border-dashed border-blue-500 rounded-lg outline-none p-1.5 resize-none shadow-md z-30"
                        style={{
                            left: `${textInput.x}px`,
                            top: `${textInput.y}px`,
                            font: `${strokeWidth * 6 + 12}px Inter, sans-serif`,
                            color: strokeColor,
                            lineHeight: 1.2,
                            minWidth: '150px',
                            minHeight: '2.5rem',
                        }}
                        autoFocus
                    />
                )}

                {/* Collaborative User Cursors */}
                {Object.entries(cursors).map(([socketId, c]) => (
                    <div
                        key={socketId}
                        className="absolute pointer-events-none z-30 transition-all duration-75 flex flex-col items-start gap-1"
                        style={{
                            left: `${c.x}px`,
                            top: `${c.y}px`,
                        }}
                    >
                        {/* Cursor pointer arrow */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1" className="text-blue-500 drop-shadow-sm">
                            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                        </svg>
                        {/* User Display Name tag */}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500 text-white shadow-sm border border-blue-400">
                            {c.displayName}
                        </span>
                    </div>
                ))}
            </main>

            {/* Guest display name input prompt modal */}
            {showNamePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-md animate-backdrop-in" />
                    
                    {/* Modal Box */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10 animate-modal-in">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                            Join Whiteboard Room
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
                            Provide a temporary display name to draw and collaborate in real time.
                        </p>

                        <form onSubmit={handleGuestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
                                    Your Display Name
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Sujal"
                                    value={guestNameInput}
                                    onChange={(e) => setGuestNameInput(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full h-10 rounded-xl font-medium text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Join Session
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}