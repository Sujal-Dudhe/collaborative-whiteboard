import express from 'express'

const app = express()

// Routes
app.get('/api/health', (_, res) => {
    res.status(200).json({ status: 'OK' })
})

export default app
