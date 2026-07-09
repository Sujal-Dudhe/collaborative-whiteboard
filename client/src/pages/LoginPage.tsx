import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import ThemeToggle from '../components/ui/ThemeToggle'

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
)

const GithubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
    </svg>
)

export default function LoginPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) navigate('/')
    }, [user, navigate])

    const handleGoogle = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
        window.location.href = `${apiUrl}/auth/google`
    }

    const handleGithub = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
        window.location.href = `${apiUrl}/auth/github`
    }

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex transition-colors duration-200">

            {/* Left panel — branding (hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-neutral-950 dark:bg-neutral-900 p-12">
                <a href="/" className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    <span className="font-semibold text-sm">Whiteboard</span>
                </a>

                <div>
                    <blockquote className="text-2xl font-medium text-white leading-snug tracking-tight">
                        "The best way to have a good idea is to have lots of ideas."
                    </blockquote>
                    <p className="mt-4 text-neutral-500 text-sm">— Linus Pauling</p>
                </div>
            </div>

            {/* Right panel — auth form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative">

                {/* Theme toggle — top right */}
                <div className="absolute top-5 right-5">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-sm">
                    {/* Mobile Brand Name Logo */}
                    <div className="lg:hidden mb-8 flex items-center justify-start">
                        <a href="/" className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition-opacity">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            <span className="font-semibold text-sm tracking-tight">Whiteboard</span>
                        </a>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Sign in
                        </h1>
                        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                            Continue to your workspace
                        </p>
                    </div>

                    {sessionStorage.getItem('post_login_action') === 'create_room' && (
                        <div className="mb-6 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                            <svg className="mt-0.5 shrink-0 text-neutral-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span>Please sign in to create a collaborative whiteboard room.</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleGoogle}
                            className="
                                w-full h-11 px-4 rounded-xl
                                flex items-center justify-center gap-3
                                text-sm font-medium
                                bg-white dark:bg-neutral-900
                                text-neutral-800 dark:text-neutral-200
                                border border-neutral-200 dark:border-neutral-700
                                hover:bg-neutral-50 dark:hover:bg-neutral-800
                                transition-all duration-150
                                shadow-card dark:shadow-card-dark
                            "
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGithub}
                            className="
                                w-full h-11 px-4 rounded-xl
                                flex items-center justify-center gap-3
                                text-sm font-medium
                                bg-neutral-950 dark:bg-neutral-100
                                text-white dark:text-neutral-900
                                hover:bg-neutral-800 dark:hover:bg-neutral-200
                                transition-all duration-150
                            "
                        >
                            <GithubIcon />
                            Continue with GitHub
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">or</span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                        No account needed to join as a guest
                    </p>
                </div>
            </div>
        </div>
    )
}