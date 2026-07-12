import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ThemeToggle from './ThemeToggle'

const PencilIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
)

export default function Navbar() {
    const { user, token, loading, logout } = useAuthStore()

    return (
        <header
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '56px' }}
            className="flex items-center justify-between px-6 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800"
        >
            <Link
                to="/"
                className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity duration-150"
            >
                <PencilIcon />
                <span className="text-sm font-semibold tracking-tight">Whiteboard</span>
            </Link>

            <div className="flex items-center gap-1">
                <ThemeToggle />

                {loading || (token && !user) ? (
                    <div className="w-8 h-8 flex items-center justify-center ml-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-700 dark:border-t-neutral-200 animate-spin" />
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-2 ml-2">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {user.name[0].toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm text-neutral-600 dark:text-neutral-300 hidden sm:block">
                            {user.name}
                        </span>
                        <button
                            onClick={logout}
                            className="text-xs px-3 py-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
                        >
                            Sign out
                        </button>
                    </div>
                ) : (
                    /* Refined sign in — smaller, less aggressive than the old black pill */
                    <Link
                        to="/login"
                        className="ml-2 text-sm font-medium px-4 py-1.5 rounded-lg border border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 transition-all duration-150"
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </header>
    )
}