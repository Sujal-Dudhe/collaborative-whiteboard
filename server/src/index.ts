import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { Server } from 'socket.io'

import app from './app'
import { connectDB } from './lib/db'
import { initIO } from './socket/io'
import { registerSocketHandlers } from './socket/socket.handler'

const PORT = process.env.PORT || 3000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const startServer = async () => {
    try {
        await connectDB()
        const httpServer = http.createServer(app)
        const io = new Server(httpServer, {
            cors: {
                origin: CLIENT_URL,
                methods: ['GET', 'POST'],
                credentials: true,
            }
        })
        initIO(io)
        registerSocketHandlers(io)

        httpServer.listen(PORT, () => {
            console.log(`Server Running At http://localhost:${PORT}/api/health`)
        })

    } catch (err) {
        console.error(`Failed to start server: ${err}`)
        process.exit(1)
    }
}

startServer()
