import express from 'express'
import cors from 'cors'
import passport from 'passport'

import './config/passport'
import { errorHandler } from './middlewares/errorHandler'

import authRoutes from './routes/auth.route'
import roomRoutes from './routes/room.route'

const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json())
app.use(passport.initialize())
// Routes
app.get('/api/health', (_, res) => {
    res.status(200).json({ status: 'OK' })
})

app.use('/api/auth', authRoutes)
app.use('/api/room', roomRoutes)

app.use(errorHandler)

export default app
