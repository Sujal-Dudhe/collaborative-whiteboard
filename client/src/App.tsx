import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { useAuthStore } from './store/authStore'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RoomPage from './pages/RoomPage'
import AuthCallbackPage from './pages/AuthCallbackPage'


export default function App() {
    const { token, fetchMe } = useAuthStore()

    useEffect(() => {
        if (token) fetchMe()
    }, [token, fetchMe])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"           element={<HomePage />} />
                <Route path="/login"      element={<LoginPage />} />
                <Route path="/room/:code" element={<RoomPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
            </Routes>
        </BrowserRouter>
    )
}