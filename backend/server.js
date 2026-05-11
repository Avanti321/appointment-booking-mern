import dotenv from 'dotenv'
dotenv.config()
 
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import videoRouter from './routes/videoRoute.js'
import prescriptionRouter from './routes/prescriptionRoute.js'
import { setupVideoSignaling } from './controllers/videoController.js'

 
// ── App & HTTP server ────────────────────────────────────────────────────────
const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000
 
connectDB()
connectCloudinary()
 
// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
setupVideoSignaling(io)

app.get('/api/video/test', (req, res) => res.json({ success: true }))
 
// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json())
app.use(cors())
 
// ── API Endpoints ─────────────────────────────────────────────────────────────
app.use('/api/admin',        adminRouter)
app.use('/api/doctor',       doctorRouter)
app.use('/api/user',         userRouter)
app.use('/api/video',        videoRouter)
app.use('/api/prescription', prescriptionRouter)
 
app.get('/', (_req, res) => res.send('API WORKING'))
 
// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(port, () => console.log('Server started on port', port))
 