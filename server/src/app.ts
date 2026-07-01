import express from 'express'
import cors from 'cors'
import passport from 'passport'

import './config/passport'
import { errorHandler } from './middlewares/errorHandler'

import authRoutes from './routes/auth.route'
import roomRoutes from './routes/room.route'
import rateLimit from 'express-rate-limit'

const app = express()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 50, // limit IP to 50 requests per 15 mins
    message: {
        statusCode: 429,
        success: false,
        message: 'Too many requests, please try again later',
        errors: []
    },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use('/api/auth', authLimiter)

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
