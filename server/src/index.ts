import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { connectDB } from './lib/db'

const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log(`Server Running At http://localhost:${PORT}/api/health`)
        })
    } catch (err) {
        console.error(`Failed to start server: ${err}`)
        process.exit(1)
    }
}

startServer()
