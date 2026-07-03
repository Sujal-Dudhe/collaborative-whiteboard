import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RoomPage from './pages/RoomPage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"           element={<HomePage />} />
                <Route path="/login"      element={<LoginPage />} />
                <Route path="/room/:code" element={<RoomPage />} />
            </Routes>
        </BrowserRouter>
    )
}