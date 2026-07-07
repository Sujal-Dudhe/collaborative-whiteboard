import { Link } from 'react-router-dom'
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

const Divider = () => <div className="border-t border-neutral-100 dark:border-neutral-800" />

export default function HomePage() {
    return (
        <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <Navbar />

            {/*
                paddingTop: 56px — inline style to guarantee the fixed navbar
                (height 56px) never overlaps content, regardless of any CSS reset.
                Tailwind utility classes like pt-14 can be zeroed out by the
                * { margin: 0; padding: 0 } reset in index.css.
                Inline styles always win that specificity battle.
            */}
            <main style={{ paddingTop: '56px' }}>

                {/* ── Hero ──────────────────────────────────────── */}
                <section className="flex flex-col items-center text-center px-6 py-24 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                        Real-time collaboration
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.08] tracking-[-0.035em] mb-5">
                        Draw together,<br />think clearly
                    </h1>

                    <p className="text-base leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-sm mb-9">
                        A minimal canvas for teams. Sketch diagrams, map ideas, and collaborate live — no signup needed to join.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <Link to="/login" className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors duration-150">
                            Create a room
                        </Link>
                        <button className="text-sm px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150">
                            Join with a code
                        </button>
                    </div>
                </section>

                {/* ── Canvas preview ────────────────────────────── */}
                <div className="max-w-4xl mx-auto px-6 pb-20">
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            <span className="text-xs text-neutral-400 dark:text-neutral-600 ml-2 font-mono">
                                whiteboard.app/room/x9k2p
                            </span>
                        </div>
                        <div className="bg-white dark:bg-neutral-950 flex items-center justify-center py-14 px-8">
                            <svg width="520" height="140" viewBox="0 0 520 140" fill="none" className="w-full max-w-lg">
                                <rect x="20"  y="24" width="130" height="56" rx="8" stroke="#d4d4d4" strokeWidth="1.5"/>
                                <text x="85"  y="57" textAnchor="middle" fontSize="12" fill="#a3a3a3" fontFamily="Inter,sans-serif">User joins room</text>
                                <line x1="150" y1="52" x2="200" y2="52" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,3"/>
                                <polygon points="197,48 206,52 197,56" fill="#d4d4d4"/>
                                <rect x="206" y="24" width="130" height="56" rx="8" stroke="#d4d4d4" strokeWidth="1.5"/>
                                <text x="271" y="57" textAnchor="middle" fontSize="12" fill="#a3a3a3" fontFamily="Inter,sans-serif">Start drawing</text>
                                <line x1="336" y1="52" x2="386" y2="52" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4,3"/>
                                <polygon points="383,48 392,52 383,56" fill="#d4d4d4"/>
                                <rect x="392" y="24" width="108" height="56" rx="8" stroke="#d4d4d4" strokeWidth="1.5"/>
                                <text x="446" y="57" textAnchor="middle" fontSize="12" fill="#a3a3a3" fontFamily="Inter,sans-serif">Others see live</text>
                                <text x="260" y="118" textAnchor="middle" fontSize="11" fill="#d4d4d4" fontFamily="Inter,sans-serif">Canvas persists across sessions</text>
                            </svg>
                        </div>
                    </div>
                </div>

                <Divider />

                {/* ── Features ──────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-600 mb-3">Features</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
                        <h2 className="text-3xl font-semibold tracking-[-0.025em] leading-tight">
                            Everything you need,<br />nothing you don't
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                            Every feature exists because real collaboration needs it.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 gap-px">
                        {features.map((f) => (
                            <div key={f.title} className="bg-white dark:bg-neutral-950 p-7 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-150">
                                <div className="w-8 h-8 rounded-lg mb-4 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                                    {f.icon}
                                </div>
                                <h3 className="text-sm font-medium mb-1.5">{f.title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── How it works ──────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-600 mb-3">How it works</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-12">Up in three steps</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                            {steps.map((s) => (
                                <div key={s.n} className="flex gap-6 py-6 first:pt-0 last:pb-0">
                                    <span className="text-xs font-medium text-neutral-400 dark:text-neutral-600 min-w-[24px] pt-0.5">{s.n}</span>
                                    <div>
                                        <h4 className="text-sm font-medium mb-1.5">{s.title}</h4>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center border border-neutral-100 dark:border-neutral-800 rounded-2xl min-h-[200px] bg-neutral-50 dark:bg-neutral-900">
                            <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
                                <rect x="10" y="10" width="180" height="120" rx="10" stroke="#e5e5e5" strokeWidth="1"/>
                                <rect x="22" y="22" width="60"  height="36"  rx="5" stroke="#d4d4d4" strokeWidth="1"/>
                                <rect x="94" y="22" width="84"  height="12"  rx="3" fill="#f5f5f5"/>
                                <rect x="94" y="40" width="56"  height="12"  rx="3" fill="#f5f5f5"/>
                                <path d="M22 82 Q52 62 80 78 T138 72" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="140" cy="72" r="3" fill="#a3a3a3"/>
                                <text x="146" y="76" fontSize="9" fill="#a3a3a3" fontFamily="Inter,sans-serif">Alex</text>
                            </svg>
                        </div>
                    </div>
                </section>

                <Divider />

                {/* ── Tools ─────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <p className="text-xs font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-neutral-600 mb-3">Tools</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.025em] mb-2">Built for every kind of thinking</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed">
                        Whether you're wireframing, diagramming, or just sketching — the right tool is one click away.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {tools.map((t) => (
                            <div key={t} className="px-4 py-2 rounded-lg text-sm border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900">
                                {t}
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── Stats ─────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-center gap-12 sm:gap-20 flex-wrap">
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-semibold tracking-tight">{s.num}</div>
                                <div className="text-sm text-neutral-400 dark:text-neutral-600 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ── CTA ───────────────────────────────────────── */}
                <section className="text-center px-6 py-24">
                    <h2 className="text-4xl font-semibold tracking-[-0.03em] mb-3">Start drawing in seconds</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
                        No credit card. No download. Just open a room and invite your team.
                    </p>
                    <div className="flex items-center gap-3 justify-center flex-wrap">
                        <Link to="/login" className="text-sm font-medium px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors duration-150">
                            Create a free room
                        </Link>
                        <button className="text-sm px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-150">
                            See how it works
                        </button>
                    </div>
                </section>

                <Divider />

                {/* ── Footer ────────────────────────────────────── */}
                <footer className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
                    <span className="text-sm font-medium text-neutral-400 dark:text-neutral-600">Whiteboard</span>
                    <div className="flex gap-6">
                        {['Privacy', 'Terms', 'GitHub'].map((l) => (
                            <span key={l} className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400 cursor-pointer transition-colors">
                                {l}
                            </span>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    )
}