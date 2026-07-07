import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AuthCallbackPage() {
    const navigate = useNavigate()
    const { setToken, fetchMe } = useAuthStore()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')

        if (token) {
            setToken(token)
            fetchMe().then(() => navigate('/'))
        } else {
            navigate('/login')
        }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm animate-pulse">
                Signing you in...
            </p>
        </div>
    )
}