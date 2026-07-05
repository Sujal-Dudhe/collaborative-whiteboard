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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-pulse">
                Signing you in...
            </p>
        </div>
    )
}