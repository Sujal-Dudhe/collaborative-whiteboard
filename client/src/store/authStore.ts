import { create } from 'zustand'
import api from '../lib/axios'

interface User {
    _id: string
    name: string
    avatar?: string
}

interface AuthStore {
    user: User | null
    token: string | null
    loading: boolean
    setToken: (token: string) => void
    fetchMe: () => Promise<void>
    logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    loading: false,

    setToken: (token: string) => {
        localStorage.setItem('token', token)
        set({ token })
    },

    fetchMe: async () => {
        set({ loading: true })
        try {
            const res = await api.get('/auth/me')
            set({ user: res.data.data, loading: false })
        } catch {
            localStorage.removeItem('token')
            set({ user: null, token: null, loading: false})
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
        window.location.href = '/login'
    },
}))