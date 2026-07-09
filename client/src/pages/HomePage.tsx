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

const Divider = () => <div className="border-t border-neutral-200/60 dark:border-neutral-800/60" />

export default function HomePage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showJoinModal, setShowJoinModal] = useState(false)

    // Form inputs
    const [roomName, setRoomName] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    const [roomCode, setRoomCode] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinError, setJoinError] = useState('')

    useEffect(() => {
        if (user && sessionStorage.getItem('post_login_action') === 'create_room') {
            sessionStorage.removeItem('post_login_action')
            setTimeout(() => {
                setShowCreateModal(true)
            }, 0)
        }
    }, [user])

    interface RoomItem {
        _id: string
        name: string
        code: string
        isPublic: boolean
        createdAt: string
    }

    const [myRooms, setMyRooms] = useState<RoomItem[]>([])
    const [fetchingRooms, setFetchingRooms] = useState(false)

    useEffect(() => {
        const fetchMyRooms = async () => {
            if (!user) return
            setFetchingRooms(true)
            try {
                const res = await api.get('/room/my-rooms')
                setMyRooms(res.data.data)
            } catch (err) {
                console.error('Failed to fetch rooms', err)
            } finally {
                setFetchingRooms(false)
            }
        }
        fetchMyRooms()
    }, [user])

    const handleDeleteRoom = async (codeToDelete: string) => {
        if (!confirm('Are you sure you want to delete this room permanently? All drawings will be deleted.')) return
        try {
            await api.delete(`/room/${codeToDelete}`)
            setMyRooms(prev => prev.filter(r => r.code !== codeToDelete))
            toast.success('Whiteboard room deleted!')
        } catch (err) {
            console.error('Failed to delete room', err)
            toast.error('Failed to delete room')
        }
    }

    const handleCreateClick = (e: React.MouseEvent) => {
        if (!user) {
            sessionStorage.setItem('post_login_action', 'create_room')
            navigate('/login')
        } else {
            e.preventDefault()
            setShowCreateModal(true)
        }
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!roomName.trim()) return
        setCreating(true)
        setCreateError('')
        try {
            const res = await api.post('/room', { name: roomName, isPublic })
            const code = res.data.data.code
            navigate(`/room/${code}`)
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            setCreateError(error.response?.data?.message || 'Failed to create room')
        } finally {
            setCreating(false)
        }
    }

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedCode = roomCode.trim()
        if (!trimmedCode) return
        setJoining(true)
        setJoinError('')
        try {
            // Verify if the room exists on the server first
            await api.get(`/room/${trimmedCode}`)
            navigate(`/room/${trimmedCode}`)
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } }
            setJoinError(error.response?.data?.message || 'Room not found or private')
        } finally {
            setJoining(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
            <Navbar />

            {/*
                paddingTop: 56px — inline style to guarantee the fixed navbar
                (height 56px) never overlaps content.
            */}
            <main style={{ paddingTop: '56px' }}>

                {/* ── Hero & Preview Section Wrap with Dot Grid ──────── */}
                <div className="relative overflow-hidden">
                    {/* Fading dot grid backdrop */}
                    <div className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_80%)] pointer-events-none" />

                    {/* ── Hero ──────────────────────────────────────── */}
                    <section className="relative z-10 flex flex-col items-center text-center px-6 py-28 max-w-3xl mx-auto">
                        <div className="
                            inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8
                            border border-neutral-200/60 dark:border-neutral-800/60
                            bg-neutral-50/50 dark:bg-neutral-900/30
                            text-xs font-medium text-neutral-500 dark:text-neutral-400
                            transition-colors duration-200
                        ">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time collaboration
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.08] tracking-[-0.035em] mb-6">
                            Draw together,<br />
                            <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-500 bg-clip-text text-transparent">
                                think clearly
                            </span>
                        </h1>

                        <p className="text-base leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-sm mb-9">
                            A minimal canvas for teams. Sketch diagrams, map ideas, and collaborate live — no signup needed to join.
                        </p>

                        <div className="flex items-center gap-3 flex-wrap justify-center">
                            <button 
                                onClick={handleCreateClick}
                                className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                Create a room
                            </button>
                            <button 
                                onClick={() => setShowJoinModal(true)}
                                className="text-sm px-5 py-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150 cursor-pointer"
                            >
                                Join with a code
                            </button>
                        </div>
                    </section>

                    {/* ── Canvas preview ────────────────────────────── */}
                    <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
                        <div className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-card dark:shadow-card-dark">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-900/60">
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-2 font-mono">
                                    whiteboard.app/room/x9k2p
                                </span>
                            </div>
                            <div className="bg-white dark:bg-neutral-950 flex items-center justify-center py-16 px-8 transition-colors duration-200">
                                <svg width="520" height="140" viewBox="0 0 520 140" fill="none" className="w-full max-w-lg">
                                    <rect x="20"  y="24" width="130" height="56" rx="8" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5"/>
                                    <text x="85"  y="57" textAnchor="middle" fontSize="12" className="fill-neutral-400 dark:fill-neutral-500" fontFamily="Inter,sans-serif">User joins room</text>
                                    <line x1="150" y1="52" x2="200" y2="52" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeDasharray="4,3"/>
                                    <polygon points="197,48 206,52 197,56" className="fill-neutral-300 dark:fill-neutral-700"/>
                                    <rect x="206" y="24" width="130" height="56" rx="8" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5"/>
                                    <text x="271" y="57" textAnchor="middle" fontSize="12" className="fill-neutral-400 dark:fill-neutral-500" fontFamily="Inter,sans-serif">Start drawing</text>
                                    <line x1="336" y1="52" x2="386" y2="52" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeDasharray="4,3"/>
                                    <polygon points="383,48 392,52 383,56" className="fill-neutral-300 dark:fill-neutral-700"/>
                                    <rect x="392" y="24" width="108" height="56" rx="8" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5"/>
                                    <text x="446" y="57" textAnchor="middle" fontSize="12" className="fill-neutral-400 dark:fill-neutral-500" fontFamily="Inter,sans-serif">Others see live</text>
                                    <text x="260" y="118" textAnchor="middle" fontSize="11" className="fill-neutral-300 dark:fill-neutral-600" fontFamily="Inter,sans-serif">Canvas persists across sessions</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider />

                {/* ── Dashboard Rooms Grid ──────────────────────── */}
                {user && (
                    <>
                        <section className="max-w-5xl mx-auto px-6 py-20 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-2">Dashboard</p>
                                    <h2 className="text-3xl font-semibold tracking-[-0.025em] leading-tight">Your Whiteboards</h2>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                                    Manage, share, and jump back into your collaborative whiteboards.
                                </p>
                            </div>

                            {fetchingRooms ? (
                                <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
                                    Loading your boards...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {/* Create Card */}
                                    <div 
                                        onClick={() => setShowCreateModal(true)}
                                        className="h-44 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-150 cursor-pointer"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        <span className="text-sm font-semibold">Create new board</span>
                                    </div>

                                    {myRooms.map((room) => (
                                        <div 
                                            key={room._id} 
                                            className="h-44 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between hover:shadow-card dark:hover:shadow-card-dark transition-all duration-150"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={room.name}>
                                                        {room.name}
                                                    </h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                        room.isPublic 
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                    }`}>
                                                        {room.isPublic ? 'Public' : 'Private'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono mb-3">
                                                    Code: {room.code}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/60 pt-3 mt-auto">
                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                                    {new Date(room.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleDeleteRoom(room.code)}
                                                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Board"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                    <Link 
                                                        to={`/room/${room.code}`}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                                                    >
                                                        Open Board
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

                {/* ── Features ──────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-24">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">Features</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
                        <h2 className="text-3xl font-semibold tracking-[-0.025em] leading-tight">
                            Everything you need,<br />nothing you don't
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                            Every feature exists because real collaboration needs it.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 bg-neutral-200/60 dark:bg-neutral-800 gap-px">
                        {features.map((f) => (
                            <div key={f.title} className="bg-white dark:bg-neutral-950 p-8 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-colors duration-150">
                                <div className="w-8 h-8 rounded-lg mb-5 flex items-center justify-center border border-neutral-200/60 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 bg-neutral-50/40 dark:bg-neutral-900/30">
                                    {f.icon}
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">{f.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── How it works ──────────────────────────────── */}
                <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">How it works</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-12">Up in three steps</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                            {steps.map((s) => (
                                <div key={s.n} className="flex gap-6 py-6 first:pt-0 last:pb-0">
                                    <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 min-w-[24px] pt-0.5">{s.n}</span>
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">{s.title}</h4>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl min-h-[220px] bg-neutral-50/50 dark:bg-neutral-900/40 p-6 shadow-sm">
                            <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
                                <rect x="10" y="10" width="180" height="120" rx="10" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1.5"/>
                                <rect x="22" y="22" width="60"  height="36"  rx="5" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1"/>
                                <rect x="94" y="22" width="84"  height="12"  rx="3" className="fill-neutral-100 dark:fill-neutral-800"/>
                                <rect x="94" y="40" width="56"  height="12"  rx="3" className="fill-neutral-100 dark:fill-neutral-800"/>
                                <path d="M22 82 Q52 62 80 78 T138 72" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="140" cy="72" r="3" className="fill-neutral-400 dark:fill-neutral-500"/>
                                <text x="146" y="76" fontSize="9" className="fill-neutral-400 dark:fill-neutral-500" fontFamily="Inter,sans-serif">Alex</text>
                            </svg>
                        </div>
                    </div>
                </section>

                <Divider />

                {/* ── Tools ─────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-24">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">Tools</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-2">Built for every kind of thinking</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed max-w-xl">
                        Whether you're wireframing, diagramming, or just sketching — the right tool is one click away.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {tools.map((t) => (
                            <div key={t} className="px-4 py-2.5 rounded-xl text-sm border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30 font-medium">
                                {t}
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── Stats ─────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-center gap-16 sm:gap-24 flex-wrap">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">{s.num}</div>
                                <div className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── CTA ───────────────────────────────────────── */}
                <section className="text-center px-6 py-28 max-w-xl mx-auto">
                    <h2 className="text-4xl font-semibold tracking-[-0.03em] mb-4">Start drawing in seconds</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-9 leading-relaxed">
                        No credit card. No download. Just open a room and invite your team.
                    </p>
                    <div className="flex items-center gap-3.5 justify-center flex-wrap">
                        <button 
                            onClick={handleCreateClick}
                            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-150 shadow-sm cursor-pointer"
                        >
                            Create a free room
                        </button>
                        <button 
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-sm font-medium px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150 cursor-pointer"
                        >
                            See how it works
                        </button>
                    </div>
                </section>

                <Divider />

                {/* ── Footer ────────────────────────────────────── */}
                <footer className="flex items-center justify-between px-8 py-8 max-w-5xl mx-auto">
                    <span className="text-xs font-semibold tracking-wide text-neutral-400 dark:text-neutral-600 uppercase">Whiteboard</span>
                    <div className="flex gap-6">
                        {['Privacy', 'Terms', 'GitHub'].map((l) => (
                            <span key={l} className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 cursor-pointer transition-colors font-medium">
                                {l}
                            </span>
                        ))}
                    </div>
                </footer>
            </main>

            {/* ── Create Room Modal ──────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-xs animate-backdrop-in"
                        onClick={() => setShowCreateModal(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10 animate-modal-in">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                Create new board
                            </h3>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
                                    Room Name
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. My Brainstorming Session"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                        Public Access
                                    </label>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Anyone with the link can join
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={`
                                        w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer
                                        ${isPublic ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-200 dark:bg-neutral-800'}
                                    `}
                                >
                                    <div 
                                        className={`
                                            bg-white dark:bg-neutral-900 w-4 h-4 rounded-full shadow-md transform duration-200
                                            ${isPublic ? 'translate-x-4 dark:bg-neutral-950' : 'translate-x-0'}
                                        `}
                                    />
                                </button>
                            </div>

                            {createError && (
                                <p className="text-xs font-medium text-red-500">
                                    {createError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full h-10 rounded-xl font-medium text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {creating ? 'Creating...' : 'Create Room'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Join Room Modal ────────────────────────────── */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-xs animate-backdrop-in"
                        onClick={() => setShowJoinModal(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xl max-w-sm w-full relative z-10 animate-modal-in">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                Join existing room
                            </h3>
                            <button 
                                onClick={() => setShowJoinModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleJoinSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
                                    Room Code
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Enter 9-digit code (e.g. x9k2p-xyz)"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
                                />
                            </div>

                            {joinError && (
                                <p className="text-xs font-medium text-red-500">
                                    {joinError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={joining}
                                className="w-full h-10 rounded-xl font-medium text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {joining ? 'Joining...' : 'Join Room'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}