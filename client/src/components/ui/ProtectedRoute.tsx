import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
    const { token, loading } = useAuthStore()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
                <p className="text-neutral-500 dark:text-neutral-400 animate-pulse">Loading...</p>
            </div>
        )
    }

    if (!token) return <Navigate to="/login" replace />

    return <>{children}</>
}