// backend/server.js
// Extended cron job to send reminder emails 1 hour before appointment

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
import { sendReminderEmail } from './utils/emailService.js'   // ← NEW

// ── App & HTTP server ────────────────────────────────────────────────────────
const app    = express()
const server = createServer(app)
const port   = process.env.PORT || 4000

connectDB()
connectCloudinary()

// ── CORS ──────────────────────────────────────────────────────────────────────
const productionOrigin = process.env.FRONTEND_URL

const allowedOrigins = productionOrigin
    ? [productionOrigin]
    : ['http://localhost:5173', 'http://localhost:5174',
       'http://127.0.0.1:5173', 'http://127.0.0.1:5174']

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS blocked: ${origin}`))
        }
    },
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token', 'dtoken', 'atoken', 'Authorization'],
    credentials:    true,
    preflightContinue:  false,
    optionsSuccessStatus: 204,
}

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:  allowedOrigins,
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

// ── Helper: parse slot date+time into a JS Date ───────────────────────────────
// slotDate format: "14_5_2026"   slotTime format: "01:00 PM"
const parseSlotDateTime = (slotDate, slotTime) => {
    const [day, month, year]    = slotDate.split('_').map(Number)
    const [timePart, meridiem]  = slotTime.split(' ')
    let [hours, minutes]        = timePart.split(':').map(Number)

    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours  = 0

    return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

// ── Cron job — runs every minute ──────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date()

        // Fetch all active appointments in one query
        const activeAppointments = await appointmentModel.find({
            cancelled:   false,
            isCompleted: false
        })

        const toComplete      = []   // ids to auto-complete
        const reminderPromises = []  // email send promises

        for (const appt of activeAppointments) {
            const slotStart = parseSlotDateTime(appt.slotDate, appt.slotTime)
            const slotEnd   = new Date(slotStart.getTime() + 30 * 60 * 1000)  // +30 min

            // ── Auto-complete: slot end time has passed ───────────────────────
            if (now >= slotEnd) {
                toComplete.push(appt._id)
                continue   // no point sending reminder for a past appointment
            }

            // ── Reminder email: between 55 and 65 minutes before slot start ──
            // The window (55–65 min) means even if the cron fires slightly late,
            // we won't miss or double-send the reminder.
            // We also check reminderSent flag to guarantee only one email ever.
            const msUntilSlot = slotStart.getTime() - now.getTime()
            const minUntil    = msUntilSlot / 60000   // convert to minutes

            if (minUntil > 55 && minUntil <= 65 && !appt.reminderSent) {

                // Mark reminder as sent immediately to prevent duplicate emails
                // if the cron fires twice within the same window
                await appointmentModel.findByIdAndUpdate(appt._id, { reminderSent: true })

                const patientEmail = appt.userData?.email
                const patientName  = appt.userData?.name  || 'Patient'
                const docName      = appt.docData?.name   || 'your doctor'

                if (patientEmail) {
                    reminderPromises.push(
                        sendReminderEmail({
                            toEmail:         patientEmail,
                            toName:          patientName,
                            docName,
                            slotDate:        appt.slotDate,
                            slotTime:        appt.slotTime,
                            appointmentType: appt.appointmentType || 'offline'
                        }).catch(err =>
                            // Don't let one failed email crash the whole cron
                            console.error(`[Cron] Email failed for ${appt._id}:`, err.message)
                        )
                    )
                }
            }
        }

        // ── Bulk complete past appointments ───────────────────────────────────
        if (toComplete.length > 0) {
            await appointmentModel.updateMany(
                { _id: { $in: toComplete } },
                { $set: { isCompleted: true } }
            )
            console.log(`[Cron] Auto-completed ${toComplete.length} appointment(s)`)
        }

        // ── Fire all reminder emails concurrently ─────────────────────────────
        if (reminderPromises.length > 0) {
            await Promise.allSettled(reminderPromises)
            console.log(`[Cron] Sent ${reminderPromises.length} reminder email(s)`)
        }

    } catch (error) {
        console.error('[Cron] Error:', error.message)
    }
})

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(port, () => console.log('Server started on port', port))