import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

interface Point     { x: number; y: number }
interface ShapeData {
    points?:      Point[]
    x?:           number
    y?:           number
    width?:       number
    height?:      number
    text?:        string
    strokeColor?: string
    strokeWidth?: number
    fillColor?:   string
}
interface Shape {
    _id:       string
    roomId:    string
    userId:    string | null
    shapeId:   'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text'
    data:      ShapeData
    isDeleted: boolean
}
interface OnlineUser { socketId: string; displayName: string; userId: string | null }

const colors = [
    { value: '#1a1a1a', label: 'Charcoal' },
    { value: '#2563eb', label: 'Blue'     },
    { value: '#dc2626', label: 'Red'      },
    { value: '#16a34a', label: 'Green'    },
    { value: '#ea580c', label: 'Orange'   },
    { value: '#9333ea', label: 'Purple'   },
    { value: '#ffffff', label: 'White'    },
]

const strokeWidths = [
    { value: 2, label: 'Thin'   },
    { value: 4, label: 'Medium' },
    { value: 7, label: 'Thick'  },
]

const toolsList = [
    { tool: 'select',    label: 'Select & Move',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg> },
    { tool: 'pen',       label: 'Freehand Pen',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
    { tool: 'line',      label: 'Straight Line',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/></svg> },
    { tool: 'arrow',     label: 'Arrow',          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg> },
    { tool: 'rectangle', label: 'Rectangle',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> },
    { tool: 'circle',    label: 'Circle',         icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> },
    { tool: 'text',      label: 'Text',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
    { tool: 'eraser',    label: 'Eraser',         icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.5l12-12c1.1-1.1 2.9-1.1 4 0l4.3 4.3c1 1 1 2.5 0 3.5l-12 12c-1.1 1.1-2.9 1.1-4 0z"/><path d="m22 21h-8"/><path d="m14 11 5 5"/></svg> },
] as const

// ─────────────────────────────────────────────────────────────
// Canvas drawing helper — kept inside the file so no import needed
// ─────────────────────────────────────────────────────────────
function drawShape(ctx: CanvasRenderingContext2D, shape: Shape | Partial<Shape>) {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = shape.data?.strokeColor || '#1a1a1a'
    ctx.fillStyle   = shape.data?.fillColor   || 'transparent'
    ctx.lineWidth   = shape.data?.strokeWidth  || 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    const x = shape.data?.x      ?? 0
    const y = shape.data?.y      ?? 0
    const w = shape.data?.width  ?? 0
    const h = shape.data?.height ?? 0

    switch (shape.shapeId) {
        case 'pen': {
            const pts = shape.data?.points || []
            if (pts.length < 2) break
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
            ctx.stroke()
            break
        }
        case 'rectangle': {
            ctx.rect(x, y, w, h)
            if (shape.data?.fillColor && shape.data.fillColor !== 'transparent') ctx.fill()
            ctx.stroke()
            break
        }
        case 'circle': {
            const cx = x + w / 2, cy = y + h / 2
            const rx = Math.abs(w / 2), ry = Math.abs(h / 2)
            if (rx > 0 && ry > 0) ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
            if (shape.data?.fillColor && shape.data.fillColor !== 'transparent') ctx.fill()
            ctx.stroke()
            break
        }
        case 'line': {
            ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.stroke()
            break
        }
        case 'arrow': {
            const x2 = x + w, y2 = y + h
            ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke()
            const angle   = Math.atan2(y2 - y, x2 - x)
            const headLen = 10 + (shape.data?.strokeWidth || 2) * 1.5
            ctx.beginPath()
            ctx.fillStyle = shape.data?.strokeColor || '#1a1a1a'
            ctx.moveTo(x2, y2)
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
            ctx.fill()
            break
        }
        case 'text': {
            const size = (shape.data?.strokeWidth || 2) * 6 + 12
            ctx.font          = `${size}px Inter, sans-serif`
            ctx.textBaseline  = 'top'
            ctx.fillStyle     = shape.data?.strokeColor || '#1a1a1a'
            const lines = (shape.data?.text || '').split('\n')
            lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.4))
            break
        }
    }
    ctx.restore()
}

const getCursorColor = (id: string) => {
    const palette = [
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#f97316', // Orange
    ]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % palette.length
    return palette[index]
}

function findHitShape(shapes: Shape[], px: number, py: number): Shape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i]
        const x = s.data.x ?? 0, y = s.data.y ?? 0
        const w = s.data.width ?? 0, h = s.data.height ?? 0

        if (s.shapeId === 'pen') {
            const pts = s.data.points || []
            for (let j = 0; j < pts.length - 1; j++) {
                const p1 = pts[j], p2 = pts[j + 1]
                const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2
                if (l2 === 0) continue
                const t    = Math.max(0, Math.min(1, ((px - p1.x) * (p2.x - p1.x) + (py - p1.y) * (p2.y - p1.y)) / l2))
                const dist = Math.hypot(px - (p1.x + t * (p2.x - p1.x)), py - (p1.y + t * (p2.y - p1.y)))
                if (dist < 8) return s
            }
        } else if (s.shapeId === 'rectangle') {
            const minX = Math.min(x, x + w), maxX = Math.max(x, x + w)
            const minY = Math.min(y, y + h), maxY = Math.max(y, y + h)
            const isFilled = s.data.fillColor && s.data.fillColor !== 'transparent'
            if (isFilled) {
                if (px >= minX - 6 && px <= maxX + 6 && py >= minY - 6 && py <= maxY + 6) return s
            } else {
                const nearTop = Math.abs(py - minY) <= 6 && px >= minX - 6 && px <= maxX + 6
                const nearBottom = Math.abs(py - maxY) <= 6 && px >= minX - 6 && px <= maxX + 6
                const nearLeft = Math.abs(px - minX) <= 6 && py >= minY - 6 && py <= maxY + 6
                const nearRight = Math.abs(px - maxX) <= 6 && py >= minY - 6 && py <= maxY + 6
                if (nearTop || nearBottom || nearLeft || nearRight) return s
            }
        } else if (s.shapeId === 'circle') {
            const cx = x + w / 2, cy = y + h / 2
            const rx = Math.abs(w / 2), ry = Math.abs(h / 2)
            if (rx > 0 && ry > 0) {
                const val = ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2)
                if (s.data.fillColor && s.data.fillColor !== 'transparent' ? val <= 1.05 : Math.abs(val - 1) <= 0.15) return s
            }
        } else if (s.shapeId === 'line' || s.shapeId === 'arrow') {
            const x2 = x + w, y2 = y + h
            const l2 = (x2 - x) ** 2 + (y2 - y) ** 2
            const t  = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x) * (x2 - x) + (py - y) * (y2 - y)) / l2))
            if (Math.hypot(px - (x + t * (x2 - x)), py - (y + t * (y2 - y))) < 8) return s
        } else if (s.shapeId === 'text') {
            const size = (s.data.strokeWidth || 2) * 6 + 12
            const lines = (s.data.text || '').split('\n')
            const tw = Math.max(...lines.map(l => l.length)) * size * 0.6
            const th = lines.length * size * 1.4
            if (px >= x && px <= x + tw && py >= y && py <= y + th) return s
        }
    }
    return null
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RoomPage() {
    const { code }     = useParams<{ code: string }>()
    const navigate     = useNavigate()
    const { user, token, loading: authLoading } = useAuthStore()

    const [roomName, setRoomName]   = useState('')
    const [isOwner, setIsOwner]     = useState(false)
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState('')

    const [displayName, setDisplayName]       = useState(() => localStorage.getItem('guest_name') || '')
    const [guestNameInput, setGuestNameInput] = useState('')
    const [showNamePrompt, setShowNamePrompt] = useState(false)

    const [onlineUsers, setOnlineUsers]         = useState<OnlineUser[]>([])
    const [shapes, setShapes]                   = useState<Shape[]>([])
    const [currentTool, setCurrentTool]         = useState<'select'|'pen'|'line'|'arrow'|'rectangle'|'circle'|'text'|'eraser'>('pen')
    const [strokeColor, setStrokeColor]         = useState('#1a1a1a')
    const [strokeWidth, setStrokeWidth]         = useState(2)
    const [fillColor, setFillColor]             = useState<'transparent'|'solid'>('transparent')
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
    const selectedShapeIdRef                    = useRef<string | null>(null)
    useEffect(() => { selectedShapeIdRef.current = selectedShapeId }, [selectedShapeId])
    const [activeShape, setActiveShape]         = useState<Partial<Shape> | null>(null)
    const [cursors, setCursors]                 = useState<Record<string, { x: number; y: number; displayName: string }>>({})

    // Text editor — all mutable values in refs to avoid stale closure bugs
    // textPosRef  = where the editor is placed (set on click, read on commit)
    // strokeColorRef / strokeWidthRef = mirror state so commitText never reads stale color/width
    // isCommitting = guard against double-commit (backdrop + blur firing together)
    const [textPosState, setTextPosState]   = useState<{ x: number; y: number } | null>(null)
    const textPosRef                        = useRef<{ x: number; y: number } | null>(null)
    const textEditorRef                     = useRef<HTMLDivElement | null>(null)
    const isCommitting                      = useRef(false)
    const strokeColorRef                    = useRef(strokeColor)
    const strokeWidthRef                    = useRef(strokeWidth)

    // Keep color/width refs in sync with state
    useEffect(() => { strokeColorRef.current = strokeColor }, [strokeColor])
    useEffect(() => { strokeWidthRef.current = strokeWidth }, [strokeWidth])

    const canvasRef        = useRef<HTMLCanvasElement | null>(null)
    const socketRef        = useRef<import('socket.io-client').Socket | null>(null)
    const lastEmitCursor   = useRef(0)
    const isDrawing        = useRef(false)
    const startPoint       = useRef<Point | null>(null)
    const currentPoints    = useRef<Point[]>([])
    const draggedShape     = useRef<Shape | null>(null)
    const dragStart        = useRef<Point | null>(null)
    const totalDx          = useRef(0)
    const totalDy          = useRef(0)

    // ── Fetch room ──────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            setLoading(true); setError('')
            try {
                const res  = await api.get(`/room/${code}`)
                const room = res.data.data
                setRoomName(room.name)
                if (user && room.ownerId?._id === user._id) setIsOwner(true)
                if (!token && !displayName) setShowNamePrompt(true)
            } catch (err) {
                const e = err as { response?: { data?: { message?: string } } }
                setError(e.response?.data?.message || 'Room not found or private')
            } finally { setLoading(false) }
        }
        if (code && !authLoading) fetch()
    }, [code, user, token, displayName, authLoading])

    // ── WebSocket ───────────────────────────────────────────
    useEffect(() => {
        if (loading || error || (!user && !displayName)) return
        const serverUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '')
        const socket    = io(serverUrl, { auth: { token: token || undefined, displayName: user ? undefined : displayName } })
        socketRef.current = socket
        socket.emit('join-room', { roomCode: code })

        socket.on('room-joined',   ({ onlineUsers, shapes }: { onlineUsers: OnlineUser[]; shapes: Shape[] }) => { setOnlineUsers(onlineUsers); setShapes(shapes) })
        socket.on('user-joined',   (u: OnlineUser)                       => setOnlineUsers(p => p.some(x => x.socketId === u.socketId) ? p : [...p, u]))
        socket.on('user-left',     ({ socketId }: { socketId: string })  => { setOnlineUsers(p => p.filter(u => u.socketId !== socketId)); setCursors(p => { const n = { ...p }; delete n[socketId]; return n }) })
        socket.on('cursor-update', (c: { socketId: string; displayName: string; x: number; y: number }) => setCursors(p => ({ ...p, [c.socketId]: { x: c.x, y: c.y, displayName: c.displayName } })))
        socket.on('shape-added',   ({ shape, tempId }: { shape: Shape; tempId: string }) => setShapes(p => { const i = p.findIndex(s => s._id === tempId); if (i !== -1) { const c = [...p]; c[i] = shape; return c } return p.some(s => s._id === shape._id) ? p : [...p, shape] }))
        socket.on('shape-moved',   ({ shape }: { shape: Shape })         => setShapes(p => p.map(s => s._id === shape._id ? shape : s)))
        socket.on('shape-removed', ({ shapeId }: { shapeId: string })    => { setShapes(p => p.filter(s => s._id !== shapeId)); setSelectedShapeId(p => p === shapeId ? null : p) })
        socket.on('canvas-cleared',()                                     => { setShapes([]); setSelectedShapeId(null) })
        socket.on('room-deleted',  ({ message }: { message: string })    => { toast.success(message); navigate('/') })
        socket.on('error',         (e: { message: string })              => console.error('[ws]', e.message))

        return () => { socket.disconnect() }
    }, [loading, error, displayName, code, user, token, navigate])

    // ── Canvas render ───────────────────────────────────────
    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const width = canvas.clientWidth
        const height = canvas.clientHeight

        // Clear with mode-appropriate background so canvas is always visible
        const isDark = document.documentElement.classList.contains('dark')
        ctx.fillStyle = isDark ? '#111113' : '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Dot grid — subtle, matches the page bg
        const dotColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
        const dotSpacing = 24
        ctx.fillStyle = dotColor
        for (let x = 0; x < width; x += dotSpacing) {
            for (let y = 0; y < height; y += dotSpacing) {
                ctx.beginPath()
                ctx.arc(x, y, 1, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        shapes.forEach(s => drawShape(ctx, s))
        if (activeShape) drawShape(ctx, activeShape)

        // Selection bounding box
        if (currentTool === 'select' && selectedShapeId) {
            const sel = shapes.find(s => s._id === selectedShapeId)
            if (sel) {
                let bx = sel.data.x ?? 0, by = sel.data.y ?? 0
                let bw = sel.data.width ?? 0, bh = sel.data.height ?? 0
                if (sel.shapeId === 'pen') {
                    const pts = sel.data.points || []
                    if (pts.length) {
                        bx = Math.min(...pts.map(p => p.x)); by = Math.min(...pts.map(p => p.y))
                        bw = Math.max(...pts.map(p => p.x)) - bx; bh = Math.max(...pts.map(p => p.y)) - by
                    }
                } else if (sel.shapeId === 'text') {
                    const size  = (sel.data.strokeWidth || 2) * 6 + 12
                    const lines = (sel.data.text || '').split('\n')
                    bw = Math.max(...lines.map(l => l.length)) * size * 0.6
                    bh = lines.length * size * 1.4
                } else {
                    bx = Math.min(sel.data.x ?? 0, (sel.data.x ?? 0) + (sel.data.width ?? 0))
                    by = Math.min(sel.data.y ?? 0, (sel.data.y ?? 0) + (sel.data.height ?? 0))
                    bw = Math.abs(sel.data.width ?? 0)
                    bh = Math.abs(sel.data.height ?? 0)
                }
                ctx.save()
                ctx.strokeStyle = '#2563eb'
                ctx.lineWidth   = 1.5
                ctx.setLineDash([5, 4])
                ctx.strokeRect(bx - 6, by - 6, bw + 12, bh + 12)
                ctx.restore()
            }
        }
    }, [shapes, activeShape, currentTool, selectedShapeId])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const onResize = () => {
            const width  = canvas.parentElement?.clientWidth  || window.innerWidth
            const height = canvas.parentElement?.clientHeight || window.innerHeight
            const dpr = window.devicePixelRatio || 1
            canvas.width  = width * dpr
            canvas.height = height * dpr
            canvas.style.width  = `${width}px`
            canvas.style.height = `${height}px`
            draw()
        }
        window.addEventListener('resize', onResize)
        onResize()
        return () => window.removeEventListener('resize', onResize)
    }, [draw])

    useEffect(() => { draw() }, [draw])

    // Redraw when theme changes so background color updates
    useEffect(() => {
        const observer = new MutationObserver(() => draw())
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [draw])

    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current?.getBoundingClientRect()
        return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 }
    }

    // ── Text helpers ────────────────────────────────────────
    // commitText reads ONLY from refs — zero stale closure risk
    const commitText = useRef<() => void>(() => {})
    commitText.current = () => {
        if (isCommitting.current) return
        const pos = textPosRef.current
        if (!pos) return
        isCommitting.current = true

        // contentEditable adds a trailing newline — strip it
        const raw = textEditorRef.current?.innerText || ''
        const val = raw.replace(/\n$/, '').trim()

        if (val) {
            const tempId = crypto.randomUUID()
            const data   = {
                x: pos.x + 4,   // account for editor left padding (4px)
                y: pos.y + 2,   // account for editor top padding (2px)
                text: val,
                strokeColor: strokeColorRef.current,
                strokeWidth: strokeWidthRef.current,
            }
            socketRef.current?.emit('draw-shape', { tempId, shapeType: 'text', data })
            setShapes(p => [...p, { _id: tempId, roomId: '', userId: null, shapeId: 'text', data, isDeleted: false }])
        }

        if (textEditorRef.current) textEditorRef.current.innerText = ''
        textPosRef.current = null
        setTextPosState(null)
        setTimeout(() => { isCommitting.current = false }, 50)
    }

    const cancelText = () => {
        if (textEditorRef.current) textEditorRef.current.innerText = ''
        textPosRef.current = null
        setTextPosState(null)
        isCommitting.current = false
    }

    const openTextEditor = (x: number, y: number) => {
        textPosRef.current = { x, y }
        setTextPosState({ x, y })
        setTimeout(() => {
            const el = textEditorRef.current
            if (!el) return
            el.focus()
            const range = document.createRange()
            range.selectNodeContents(el)
            range.collapse(false)
            window.getSelection()?.removeAllRanges()
            window.getSelection()?.addRange(range)
        }, 0)
    }

    // ── Mouse handlers ──────────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e)

        if (currentTool === 'eraser') {
            const hit = findHitShape(shapes, coords.x, coords.y)
            if (hit) { socketRef.current?.emit('delete-shape', { shapeId: hit._id }); setShapes(p => p.filter(s => s._id !== hit._id)); setSelectedShapeId(null) }
            isDrawing.current = true
            return
        }

        if (currentTool === 'text') {
            if (textPosRef.current) {
                // Editor already open — commit it, then open new one after a tick
                commitText.current()
                const nx = coords.x, ny = coords.y
                setTimeout(() => openTextEditor(nx, ny), 60)
            } else {
                openTextEditor(coords.x, coords.y)
            }
            return
        }

        if (currentTool === 'select') {
            const hit = findHitShape(shapes, coords.x, coords.y)
            if (hit) { draggedShape.current = hit; dragStart.current = { x: e.clientX, y: e.clientY }; totalDx.current = 0; totalDy.current = 0; setSelectedShapeId(hit._id); isDrawing.current = true }
            else setSelectedShapeId(null)
            return
        }

        isDrawing.current  = true
        startPoint.current = coords
        if (currentTool === 'pen') currentPoints.current = [coords]
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoords(e)
        const now    = Date.now()
        if (now - lastEmitCursor.current > 40) { socketRef.current?.emit('cursor-move', { x: coords.x, y: coords.y }); lastEmitCursor.current = now }
        if (!isDrawing.current) return

        if (currentTool === 'eraser' && isDrawing.current) {
            const hit = findHitShape(shapes, coords.x, coords.y)
            if (hit) {
                socketRef.current?.emit('delete-shape', { shapeId: hit._id })
                setShapes(p => p.filter(s => s._id !== hit._id))
                setSelectedShapeId(null)
            }
            return
        }

        if (currentTool === 'select' && draggedShape.current && dragStart.current) {
            const dx = e.clientX - dragStart.current.x, dy = e.clientY - dragStart.current.y
            dragStart.current = { x: e.clientX, y: e.clientY }; totalDx.current += dx; totalDy.current += dy
            setShapes(p => p.map(s => {
                if (s._id !== draggedShape.current!._id) return s
                if (s.shapeId === 'pen') return { ...s, data: { ...s.data, points: s.data.points?.map(pt => ({ x: pt.x + dx, y: pt.y + dy })) } }
                return { ...s, data: { ...s.data, x: (s.data.x ?? 0) + dx, y: (s.data.y ?? 0) + dy } }
            }))
            return
        }

        if (!startPoint.current) return
        const w = coords.x - startPoint.current.x, h = coords.y - startPoint.current.y
        if (currentTool === 'pen') {
            currentPoints.current.push(coords)
            setActiveShape({ shapeId: 'pen', data: { points: [...currentPoints.current], strokeColor, strokeWidth } })
        } else {
            setActiveShape({ shapeId: currentTool as Shape['shapeId'], data: { x: startPoint.current.x, y: startPoint.current.y, width: w, height: h, strokeColor, strokeWidth, fillColor: fillColor === 'solid' ? strokeColor + '20' : 'transparent' } })
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (currentTool === 'text' || !isDrawing.current) return
        isDrawing.current = false
        const coords = getCanvasCoords(e)

        if (currentTool === 'select' && draggedShape.current) {
            if (totalDx.current !== 0 || totalDy.current !== 0) socketRef.current?.emit('move-shape', { shapeId: draggedShape.current._id, dx: totalDx.current, dy: totalDy.current })
            draggedShape.current = null; dragStart.current = null; return
        }
        if (!startPoint.current) return

        const tempId = crypto.randomUUID()
        const w = coords.x - startPoint.current.x, h = coords.y - startPoint.current.y
        const data: ShapeData = { strokeColor, strokeWidth }

        if (currentTool === 'pen') {
            if (currentPoints.current.length < 2) {
                startPoint.current = null; currentPoints.current = []; setActiveShape(null)
                return
            }
            data.points = [...currentPoints.current]
        } else {
            if (Math.abs(w) < 2 && Math.abs(h) < 2) {
                startPoint.current = null; currentPoints.current = []; setActiveShape(null)
                return
            }
            data.x = startPoint.current.x
            data.y = startPoint.current.y
            data.width = w
            data.height = h
            if (currentTool === 'rectangle' || currentTool === 'circle') {
                data.fillColor = fillColor === 'solid' ? strokeColor + '20' : 'transparent'
            }
        }

        socketRef.current?.emit('draw-shape', { tempId, shapeType: currentTool as Shape['shapeId'], data })
        setShapes(p => [...p, { _id: tempId, roomId: '', userId: null, shapeId: currentTool as Shape['shapeId'], data, isDeleted: false }])
        startPoint.current = null; currentPoints.current = []; setActiveShape(null)
    }

    // ── Keyboard shortcuts ──────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); socketRef.current?.emit('undo') }
            if (e.key === 'Escape') { cancelText() }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement?.tagName === 'INPUT' || 
                    document.activeElement?.tagName === 'TEXTAREA' || 
                    document.activeElement?.hasAttribute('contenteditable')) {
                    return
                }
                if (selectedShapeIdRef.current) {
                    const id = selectedShapeIdRef.current
                    socketRef.current?.emit('delete-shape', { shapeId: id })
                    setShapes(p => p.filter(s => s._id !== id))
                    setSelectedShapeId(null)
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    // ── Actions ─────────────────────────────────────────────
    const handleClearCanvas  = async () => { if (!confirm('Clear canvas? Cannot be undone.')) return; try { await api.delete(`/room/${code}/clear`); toast.success('Canvas cleared!') } catch { toast.error('Failed to clear') } }
    const handleDeleteRoom   = async () => { if (!confirm('Delete room? Everyone will be removed.')) return; try { await api.delete(`/room/${code}`); toast.success('Room deleted!') } catch { toast.error('Failed to delete') } }
    const handleShare        = ()       => { navigator.clipboard.writeText(window.location.href); toast.success('Room URL copied!') }
    const handleGuestSubmit  = (e: React.FormEvent) => { e.preventDefault(); const t = guestNameInput.trim(); if (!t) return; localStorage.setItem('guest_name', t); setDisplayName(t); setShowNamePrompt(false) }

    const handleExport = async () => {
        const canvas = canvasRef.current; if (!canvas) return
        try {
            const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height
            const tc  = tmp.getContext('2d')!
            tc.fillStyle = document.documentElement.classList.contains('dark') ? '#111113' : '#ffffff'
            tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(canvas, 0, 0)
            const filename = `${roomName.replace(/\s+/g, '_') || 'whiteboard'}-${code}.png`
            if ('showSaveFilePicker' in window) {
                const blob = await new Promise<Blob | null>(r => tmp.toBlob(r, 'image/png')); if (!blob) throw new Error()
                const handle = await (window as any).showSaveFilePicker({ suggestedName: filename, types: [{ description: 'PNG', accept: { 'image/png': ['.png'] } }] })
                const w2 = await handle.createWritable(); await w2.write(blob); await w2.close(); toast.success('Saved!')
            } else { const a = document.createElement('a'); a.download = filename; a.href = tmp.toDataURL('image/png'); a.click(); toast.success('Exported!') }
        } catch (err) { if (err instanceof Error && err.name === 'AbortError') return; toast.error('Export failed') }
    }

    const fontSize = strokeWidth * 6 + 12

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950"><p className="text-neutral-500 animate-pulse text-sm">Loading room...</p></div>
    if (error)   return <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 p-6 text-center"><h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Access Denied</h1><p className="text-sm text-neutral-500 mb-6">{error}</p><Link to="/" className="text-sm font-medium px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">Go Home</Link></div>

    return (
        <div className="h-screen w-screen overflow-hidden relative select-none bg-white dark:bg-neutral-950">

            {/* ── Header ────────────────────────────────────────── */}
            <header className="absolute top-4 left-4 right-4 z-20 h-14 flex items-center justify-between px-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </Link>
                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                    <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{roomName}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1.5 mr-2">
                        {onlineUsers.slice(0, 4).map(u => (
                            <div key={u.socketId} title={u.displayName} className="w-7 h-7 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                                {u.displayName[0]}
                            </div>
                        ))}
                        {onlineUsers.length > 4 && <div className="w-7 h-7 rounded-full border-2 border-white dark:border-neutral-950 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px] font-bold">+{onlineUsers.length - 4}</div>}
                    </div>

                    <button onClick={handleShare}  className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        Share
                    </button>
                    <button onClick={handleExport} className="text-xs font-medium px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export
                    </button>
                    {isOwner && <>
                        <button onClick={handleClearCanvas} title="Clear canvas" className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                        <button onClick={handleDeleteRoom} title="Delete room" className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </>}
                </div>
            </header>

            {/* ── Left toolbar ──────────────────────────────────── */}
            <aside className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-2 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                {toolsList.map(item => (
                    <button
                        key={item.tool}
                        onClick={() => { if (currentTool === 'text' && textPosRef.current) commitText.current(); setCurrentTool(item.tool); setSelectedShapeId(null) }}
                        title={item.label}
                        className={`p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${currentTool === item.tool ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                        {item.icon}
                    </button>
                ))}
            </aside>

            {/* ── Right style panel ─────────────────────────────── */}
            <aside className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 p-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm w-40">
                <div>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Colors</p>
                    <div className="grid grid-cols-3 gap-2">
                        {colors.map(c => (
                            <button key={c.value} onClick={() => setStrokeColor(c.value)} title={c.label}
                                className={`w-7 h-7 rounded-lg border transition-all cursor-pointer ${strokeColor === c.value ? 'border-neutral-900 dark:border-white scale-110 shadow-sm' : c.value === '#ffffff' ? 'border-neutral-300 dark:border-neutral-700 hover:scale-105' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                    </div>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-800" />
                <div>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Thickness</p>
                    <div className="flex gap-1.5">
                        {strokeWidths.map(w => (
                            <button key={w.value} onClick={() => setStrokeWidth(w.value)}
                                className={`flex-1 text-xs py-1 rounded-lg border font-medium transition-all cursor-pointer ${strokeWidth === w.value ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                            >
                                {w.label[0]}
                            </button>
                        ))}
                    </div>
                </div>
                {(currentTool === 'rectangle' || currentTool === 'circle') && <>
                    <div className="border-t border-neutral-200 dark:border-neutral-800" />
                    <div>
                        <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Fill</p>
                        <div className="flex gap-1.5">
                            {[{ value: 'transparent', label: 'None' }, { value: 'solid', label: 'Fill' }].map(item => (
                                <button key={item.value} onClick={() => setFillColor(item.value as any)}
                                    className={`flex-1 text-xs py-1 rounded-lg border font-medium transition-all cursor-pointer ${fillColor === item.value ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white' : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>}
                <div className="border-t border-neutral-200 dark:border-neutral-800" />
                <button onClick={() => socketRef.current?.emit('undo')} className="w-full text-xs py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center gap-1.5 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    Undo
                </button>
            </aside>

            {/* ── Canvas ────────────────────────────────────────── */}
            <main className="h-full w-full relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className={`absolute inset-0 block ${currentTool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                />

                {textPosState && (
                    <>
                        <div
                            className="absolute inset-0"
                            style={{ zIndex: 28, cursor: 'text' }}
                            onMouseDown={e => {
                                if (!textEditorRef.current?.contains(e.target as Node)) {
                                    commitText.current()
                                }
                            }}
                        />
                        <div
                            ref={textEditorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText.current() }
                                if (e.key === 'Escape')               { e.preventDefault(); cancelText() }
                            }}
                            className="absolute outline-none whitespace-pre-wrap break-words"
                            style={{
                                zIndex:           30,
                                left:             `${textPosState.x}px`,
                                top:              `${textPosState.y}px`,
                                minWidth:         '80px',
                                maxWidth:         '520px',
                                minHeight:        `${(strokeWidthRef.current * 6 + 12) * 1.5}px`,
                                font:             `${strokeWidthRef.current * 6 + 12}px/1.5 Inter, sans-serif`,
                                color:            strokeColor,
                                caretColor:       strokeColor,
                                padding:          '2px 4px',
                                background:       'transparent',
                                borderBottom:     `2px solid ${strokeColor}`,
                                userSelect:       'text',
                                WebkitUserSelect: 'text',
                                cursor:           'text',
                            }}
                        />
                    </>
                )}

                {/* ── Remote cursors ───────────────────────────── */}
                {Object.entries(cursors).map(([socketId, c]) => {
                    const color = getCursorColor(socketId)
                    return (
                        <div key={socketId} className="absolute pointer-events-none z-30 flex flex-col items-start gap-1" style={{ left: `${c.x}px`, top: `${c.y}px` }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={color} stroke="white" strokeWidth="1.5" className="drop-shadow-sm">
                                <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                            </svg>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white border drop-shadow-sm" style={{ backgroundColor: color, borderColor: `${color}cc` }}>
                                {c.displayName}
                            </span>
                        </div>
                    )
                })}
            </main>

            {/* ── Guest name prompt ──────────────────────────────── */}
            {showNamePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-md" />
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">Join Whiteboard</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">Enter a display name to collaborate in real time.</p>
                        <form onSubmit={handleGuestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Display Name</label>
                                <input type="text" required placeholder="e.g. Alex" value={guestNameInput} onChange={e => setGuestNameInput(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full h-10 rounded-xl font-medium text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer">
                                Join Session
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}