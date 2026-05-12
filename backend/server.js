import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cron from 'node-cron'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import videoRouter from './routes/videoRoute.js'
import prescriptionRouter from './routes/prescriptionRoute.js'
import { setupVideoSignaling } from './controllers/videoController.js'
import appointmentModel from './models/appointmentModel.js'

// ── App & HTTP server ────────────────────────────────────────────────────────
const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

// ── CORS origin ───────────────────────────────────────────────────────────────
// In production set FRONTEND_URL to your deployed URL.
// In dev, Vite can start on 5173 or 5174, so we allow both.
const productionOrigin = process.env.FRONTEND_URL

const allowedOrigins = productionOrigin
    ? [productionOrigin]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS blocked: ${origin}`))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token', 'dtoken', 'atoken', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
}

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    }
})
setupVideoSignaling(io)

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions))
app.use(express.json())

app.get('/api/video/test', (req, res) => res.json({ success: true }))

// ── API Endpoints ─────────────────────────────────────────────────────────────
app.use('/api/admin',        adminRouter)
app.use('/api/doctor',       doctorRouter)
app.use('/api/user',         userRouter)
app.use('/api/video',        videoRouter)
app.use('/api/prescription', prescriptionRouter)

app.get('/', (_req, res) => res.send('API WORKING'))

// ── Auto-complete appointments cron job ───────────────────────────────────────
// Runs every minute to check if any appointment's date+time has passed
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date()

        // Fetch all active (not cancelled, not completed) appointments
        const activeAppointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false
        })

        const toComplete = []

        for (const appt of activeAppointments) {
            // slotDate is stored as "D_M_YYYY" e.g. "11_5_2026"
            const [day, month, year] = appt.slotDate.split('_').map(Number)

            // slotTime is stored as "10:00 AM" / "02:30 PM"
            const [timePart, meridiem] = appt.slotTime.split(' ')
            let [hours, minutes] = timePart.split(':').map(Number)

            if (meridiem === 'PM' && hours !== 12) hours += 12
            if (meridiem === 'AM' && hours === 12) hours = 0

            // Build the appointment end datetime (slot start + 30 min duration)
            const apptEnd = new Date(year, month - 1, day, hours, minutes + 30, 0, 0)

            if (now >= apptEnd) {
                toComplete.push(appt._id)
            }
        }

        if (toComplete.length > 0) {
            await appointmentModel.updateMany(
                { _id: { $in: toComplete } },
                { $set: { isCompleted: true } }
            )
            console.log(`[Cron] Auto-completed ${toComplete.length} appointment(s)`)
        }

    } catch (error) {
        console.error('[Cron] Auto-complete error:', error.message)
    }
})

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(port, () => console.log('Server started on port', port))