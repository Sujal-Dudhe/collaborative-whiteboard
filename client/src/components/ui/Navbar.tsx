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
    const { user, logout } = useAuthStore()

    return (
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '56px' }}
            className="flex items-center justify-between px-6 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800"
        >
            <Link to="/" className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity duration-150">
                <PencilIcon />
                <span className="text-sm font-semibold tracking-tight">Whiteboard</span>
            </Link>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                {user ? (
                    <div className="flex items-center gap-3 ml-1">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {user.name[0].toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 hidden sm:block">
                            {user.name}
                        </span>
                        <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150">
                            Sign out
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="ml-1 text-sm font-medium px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors duration-150">
                        Sign in
                    </Link>
                )}
            </div>
        </header>
    )
}