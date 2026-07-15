import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'
import Navbar from '../components/ui/Navbar'

const features = [
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
        title: 'Drawing tools',
        desc: 'Pen, rectangle, circle, arrow, line, and text. Everything to express an idea.',
    },
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        title: 'Live cursors',
        desc: 'See teammates in real time with name labels. Know who is drawing what.',
    },
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        title: 'Persistent canvas',
        desc: 'Everything saved automatically. Rejoin a week later and pick up where you left off.',
    },
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>,
        title: 'Per-user undo',
        desc: "Undo only your own changes. Your mistakes never erase anyone else's work.",
    },
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
        title: 'Private rooms',
        desc: 'Create rooms only your team can access. A link is the only way in.',
    },
    {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
        title: 'Export as PNG',
        desc: 'One click to download the canvas as an image and share it anywhere.',
    },
]

const steps = [
    { n: '01', title: 'Create a room',  desc: "Sign in with Google or GitHub. Name your room, set it public or private, and you're in." },
    { n: '02', title: 'Share the link', desc: 'Copy the room URL and send it. Teammates join instantly — no account required.' },
    { n: '03', title: 'Draw together',  desc: "Pick a tool and start. Every stroke appears on everyone's canvas in real time." },
]

const tools = ['Freehand pen','Rectangle','Circle','Arrow','Line','Text','Color picker','Stroke width','Select & move','Export PNG']

const stats = [
    { num: '10k+',      label: 'rooms created'   },
    { num: 'Real-time', label: 'zero delay sync' },
    { num: 'No setup',  label: 'open and draw'   },
]

const Divider = () => (
    <div className="border-t border-neutral-100 dark:border-neutral-800" />
)

export default function HomePage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showJoinModal, setShowJoinModal]   = useState(false)
    const [roomName, setRoomName]             = useState('')
    const [isPublic, setIsPublic]             = useState(true)
    const [creating, setCreating]             = useState(false)
    const [createError, setCreateError]       = useState('')
    const [roomCode, setRoomCode]             = useState('')
    const [joining, setJoining]               = useState(false)
    const [joinError, setJoinError]           = useState('')

    interface RoomItem { _id: string; name: string; code: string; isPublic: boolean; createdAt: string }
    const [myRooms, setMyRooms]               = useState<RoomItem[]>([])
    const [fetchingRooms, setFetchingRooms]   = useState(false)

    useEffect(() => {
        if (user && sessionStorage.getItem('post_login_action') === 'create_room') {
            sessionStorage.removeItem('post_login_action')
            setTimeout(() => setShowCreateModal(true), 0)
        }
    }, [user])

    useEffect(() => {
        const fetch = async () => {
            if (!user) return
            setFetchingRooms(true)
            try {
                const res = await api.get('/room/my-rooms')
                setMyRooms(res.data.data)
            } catch (err) { console.error(err) }
            finally { setFetchingRooms(false) }
        }
        fetch()
    }, [user])

    const handleDeleteRoom = async (code: string) => {
        if (!confirm('Delete this room permanently?')) return
        try {
            await api.delete(`/room/${code}`)
            setMyRooms(p => p.filter(r => r.code !== code))
            toast.success('Room deleted')
        } catch { toast.error('Failed to delete room') }
    }

    const handleCreateClick = () => {
        if (!user) { sessionStorage.setItem('post_login_action', 'create_room'); navigate('/login') }
        else setShowCreateModal(true)
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!roomName.trim()) return
        setCreating(true); setCreateError('')
        try {
            const res = await api.post('/room', { name: roomName, isPublic })
            navigate(`/room/${res.data.data.code}`)
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            setCreateError(error.response?.data?.message || 'Failed to create room')
        } finally { setCreating(false) }
    }

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const code = roomCode.trim()
        if (!code) return
        setJoining(true); setJoinError('')
        try {
            await api.get(`/room/${code}`)
            navigate(`/room/${code}`)
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            setJoinError(error.response?.data?.message || 'Room not found or private')
        } finally { setJoining(false) }
    }

    return (
        <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <Navbar />

            <main style={{ paddingTop: '56px' }}>

                {/* ── Hero + Preview (shared dot-grid bg) ─────── */}
                <div className="relative">
                    {/* Dot grid fades out toward bottom */}
                    <div className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,white_50%,transparent_100%)] pointer-events-none" />

                    {/* Hero */}
                    <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-12 max-w-3xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-500 dark:text-neutral-400 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time collaboration
                        </div>

                        {/* Heading — clean gradient that's visible in both modes */}
                        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.08] tracking-[-0.035em] mb-5 text-neutral-900 dark:text-white">
                            Draw together,<br />
                            <span className="text-neutral-400 dark:text-neutral-500">
                                think clearly
                            </span>
                        </h1>

                        <p className="text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
                            A minimal canvas for teams. Sketch diagrams, map ideas, and collaborate live — no signup needed to join.
                        </p>

                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <button
                                onClick={handleCreateClick}
                                className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 shadow-sm"
                            >
                                Create a room
                            </button>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="text-sm font-medium px-5 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 dark:border-neutral-600 dark:hover:border-neutral-500 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-150"
                            >
                                Join with a code
                            </button>
                        </div>
                    </section>

                    {/* Canvas preview */}
                    <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
                        <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                            {/* Window chrome */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2 font-mono">
                                    whiteboard.app/room/x9k2p
                                </span>
                            </div>
                            {/* Preview content */}
                            <div className="bg-white dark:bg-neutral-950 flex items-center justify-center py-14 px-8">
                                <svg width="520" height="130" viewBox="0 0 520 130" fill="none" className="w-full max-w-lg">
                                    <rect x="20"  y="20" width="130" height="52" rx="8" stroke="#d4d4d8" strokeWidth="1.5"/>
                                    <text x="85"  y="51" textAnchor="middle" fontSize="12" fill="#a1a1aa" fontFamily="Inter,sans-serif">User joins room</text>
                                    <line x1="150" y1="46" x2="200" y2="46" stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="4,3"/>
                                    <polygon points="197,42 206,46 197,50" fill="#d4d4d8"/>
                                    <rect x="206" y="20" width="130" height="52" rx="8" stroke="#d4d4d8" strokeWidth="1.5"/>
                                    <text x="271" y="51" textAnchor="middle" fontSize="12" fill="#a1a1aa" fontFamily="Inter,sans-serif">Start drawing</text>
                                    <line x1="336" y1="46" x2="386" y2="46" stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="4,3"/>
                                    <polygon points="383,42 392,46 383,50" fill="#d4d4d8"/>
                                    <rect x="392" y="20" width="108" height="52" rx="8" stroke="#d4d4d8" strokeWidth="1.5"/>
                                    <text x="446" y="51" textAnchor="middle" fontSize="12" fill="#a1a1aa" fontFamily="Inter,sans-serif">Others see live</text>
                                    <text x="260" y="108" textAnchor="middle" fontSize="11" fill="#d4d4d8" fontFamily="Inter,sans-serif">Canvas persists across sessions</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider />

                {/* ── Dashboard (logged-in only) ───────────────── */}
                {user && (
                    <>
                        <section className="max-w-5xl mx-auto px-6 py-16">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-1.5">Dashboard</p>
                                    <h2 className="text-2xl font-semibold tracking-[-0.02em]">Your whiteboards</h2>
                                </div>
                            </div>

                            {fetchingRooms ? (
                                <p className="text-sm text-neutral-400 animate-pulse py-8">Loading your boards...</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Create card */}
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="h-40 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150 cursor-pointer"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        <span className="text-sm font-medium">New board</span>
                                    </button>

                                    {myRooms.map((room) => (
                                        <div
                                            key={room._id}
                                            className="h-40 p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h3 className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">{room.name}</h3>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${room.isPublic ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                                                        {room.isPublic ? 'Public' : 'Private'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">#{room.code}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                                    {new Date(room.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleDeleteRoom(room.code)}
                                                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                    <Link
                                                        to={`/room/${room.code}`}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                                                    >
                                                        Open
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        <Divider />
                    </>
                )}

                {/* ── Features ────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">Features</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
                        <h2 className="text-3xl font-semibold tracking-[-0.025em] leading-tight">
                            Everything you need,<br />nothing you don't
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                            Every feature exists because real collaboration needs it.
                        </p>
                    </div>

                    {/*
                        Feature grid:
                        Light: cards are white on neutral-100 page bg — clean separation
                        Dark:  cards are neutral-900 on neutral-950 bg — clear elevation
                        No gap-px trick needed — simple card approach is more reliable
                    */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="bg-neutral-50 dark:bg-neutral-900 p-7 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 transition-colors duration-150"
                            >
                                <div className="w-8 h-8 rounded-lg mb-4 flex items-center justify-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/60 text-neutral-500 dark:text-neutral-400">
                                    {f.icon}
                                </div>
                                <h3 className="text-sm font-semibold mb-1.5 text-neutral-900 dark:text-neutral-100">{f.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── How it works ────────────────────────────── */}
                <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">How it works</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-12">Up in three steps</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {steps.map((s) => (
                                <div key={s.n} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                                    <span className="text-xs font-semibold text-neutral-300 dark:text-neutral-700 min-w-[28px] pt-0.5">{s.n}</span>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1 text-neutral-900 dark:text-neutral-100">{s.title}</h4>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center rounded-2xl min-h-[200px] border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                            <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
                                <rect x="10" y="10" width="180" height="120" rx="10" stroke="#e4e4e7" strokeWidth="1.5" className="dark:stroke-neutral-800"/>
                                <rect x="22" y="22" width="60" height="36" rx="5" stroke="#d4d4d8" strokeWidth="1" className="dark:stroke-neutral-700"/>
                                <rect x="94" y="22" width="84" height="12" rx="3" fill="#f4f4f5" className="dark:fill-neutral-800"/>
                                <rect x="94" y="40" width="56" height="12" rx="3" fill="#f4f4f5" className="dark:fill-neutral-800"/>
                                <path d="M22 82 Q52 62 80 78 T138 72" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" className="dark:stroke-neutral-700"/>
                                <circle cx="140" cy="72" r="3" fill="#a1a1aa"/>
                                <text x="146" y="76" fontSize="9" fill="#a1a1aa" fontFamily="Inter,sans-serif">Alex</text>
                            </svg>
                        </div>
                    </div>
                </section>

                <Divider />

                {/* ── Tools ───────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">Tools</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-2">Built for every kind of thinking</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-9 leading-relaxed max-w-md">
                        Whether you're wireframing, diagramming, or just sketching — the right tool is one click away.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {tools.map((t) => (
                            <span key={t} className="px-3.5 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 font-medium">
                                {t}
                            </span>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── Stats ───────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-center gap-16 sm:gap-24 flex-wrap">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{s.num}</div>
                                <div className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-1 tracking-wide">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── CTA ─────────────────────────────────────── */}
                <section className="text-center px-6 py-24">
                    <h2 className="text-4xl font-semibold tracking-[-0.03em] mb-3">Start drawing in seconds</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
                        No credit card. No download. Just open a room and invite your team.
                    </p>
                    <div className="flex items-center gap-3 justify-center flex-wrap">
                        <button
                            onClick={handleCreateClick}
                            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors duration-150 shadow-sm"
                        >
                            Create a free room
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-sm font-medium px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150"
                        >
                            See how it works
                        </button>
                    </div>
                </section>

                <Divider />

                {/* ── Footer ──────────────────────────────────── */}
                <footer className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
                    <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 tracking-wide">Whiteboard</span>
                    <div className="flex gap-6">
                        {['Privacy', 'Terms', 'GitHub'].map((l) => (
                            <span key={l} className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 cursor-pointer transition-colors font-medium">{l}</span>
                        ))}
                    </div>
                </footer>
            </main>

            {/* ── Create Room Modal ────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 animate-backdrop-in" onClick={() => setShowCreateModal(false)} />
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10 animate-modal-in">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Create new board</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Room name</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Sprint planning"
                                    value={roomName}
                                    onChange={e => setRoomName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors placeholder:text-neutral-400"
                                />
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Public access</p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Anyone with the link can join</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${isPublic ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${isPublic ? 'translate-x-4 bg-white dark:bg-neutral-900' : 'translate-x-0 bg-white dark:bg-neutral-400'}`} />
                                </button>
                            </div>
                            {createError && <p className="text-xs text-red-500 font-medium">{createError}</p>}
                            <button
                                type="submit" disabled={creating}
                                className="w-full h-10 rounded-xl text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                            >
                                {creating ? 'Creating...' : 'Create room'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Join Room Modal ──────────────────────────── */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 animate-backdrop-in" onClick={() => setShowJoinModal(false)} />
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10 animate-modal-in">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Join a room</h3>
                            <button onClick={() => setShowJoinModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleJoinSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">Room code</label>
                                <input
                                    type="text" required
                                    placeholder="Paste the room code"
                                    value={roomCode}
                                    onChange={e => setRoomCode(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors placeholder:text-neutral-400 font-mono"
                                />
                            </div>
                            {joinError && <p className="text-xs text-red-500 font-medium">{joinError}</p>}
                            <button
                                type="submit" disabled={joining}
                                className="w-full h-10 rounded-xl text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                            >
                                {joining ? 'Joining...' : 'Join room'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}