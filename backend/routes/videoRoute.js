import express from 'express'
import { createVideoRoom, endVideoCall, getVideoRoom } from '../controllers/videoController.js'
import authUser from '../middlewares/authUser.js'
import authDoctor from '../middlewares/authDoctor.js'

const videoRouter = express.Router()

videoRouter.post('/create-room', authDoctor, createVideoRoom)
videoRouter.post('/end-call', authDoctor, endVideoCall)
videoRouter.get('/room/:appointmentId', authUser, getVideoRoom)

export default videoRouter