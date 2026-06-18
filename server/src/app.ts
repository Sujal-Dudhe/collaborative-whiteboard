import express from 'express'
import passport from 'passport'

import './config/passport'
import authRoutes from './routes/auth.route'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

app.use(express.json())
app.use(passport.initialize())

// Routes
app.get('/api/health', (_, res) => {
    res.status(200).json({ status: 'OK' })
})

app.use('/api/auth', authRoutes)

app.use(errorHandler)

export default app
