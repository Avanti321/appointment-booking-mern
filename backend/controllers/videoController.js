// backend/controllers/videoController.js

import appointmentModel from '../models/appointmentModel.js'
import { v4 as uuidv4 } from 'uuid'

// ── Create video room (called by doctor) ─────────────────────────────────────
export const createVideoRoom = async (req, res) => {
    try {
        console.log('createVideoRoom called, body:', req.body)

        const { appointmentId, docId } = req.body

        if (!appointmentId) {
            return res.json({ success: false, message: 'appointmentId is required' })
        }

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        if (!appointment.videoRoomId) {
            appointment.videoRoomId = uuidv4()
        }
        appointment.videoCallStatus = 'waiting'
        appointment.videoCallStartedAt = new Date()
        await appointment.save()

        console.log('Room created:', appointment.videoRoomId)

        res.json({
            success: true,
            roomId: appointment.videoRoomId,
            appointmentId: appointment._id
        })
    } catch (error) {
        console.error('createVideoRoom error:', error)
        res.json({ success: false, message: error.message })
    }
}

// ── End video call ────────────────────────────────────────────────────────────
export const endVideoCall = async (req, res) => {
    try {
        const { appointmentId } = req.body

        await appointmentModel.findByIdAndUpdate(appointmentId, {
            videoCallStatus: 'ended',
            videoCallEndedAt: new Date()
        })

        res.json({ success: true, message: 'Video call ended' })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Get video room info (called by patient) ───────────────────────────────────
export const getVideoRoom = async (req, res) => {
    try {
        const { appointmentId } = req.params

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        res.json({
            success: true,
            roomId: appointment.videoRoomId || null,
            videoCallStatus: appointment.videoCallStatus || 'idle'
        })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Socket.IO signaling ───────────────────────────────────────────────────────
export const setupVideoSignaling = (io) => {
    const rooms = new Map()

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id)

        socket.on('join-room', ({ roomId, userId, role }) => {
            socket.join(roomId)
            socket.data.roomId = roomId
            socket.data.userId = userId
            socket.data.role = role

            if (!rooms.has(roomId)) rooms.set(roomId, new Set())
            rooms.get(roomId).add(socket.id)

            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                userId,
                role
            })

            console.log(`${role} joined room ${roomId}`)
        })

        socket.on('offer', ({ roomId, offer, to }) => {
            socket.to(to).emit('offer', { offer, from: socket.id })
        })

        socket.on('answer', ({ answer, to }) => {
            socket.to(to).emit('answer', { answer, from: socket.id })
        })

        socket.on('ice-candidate', ({ candidate, to }) => {
            socket.to(to).emit('ice-candidate', { candidate, from: socket.id })
        })

        socket.on('leave-room', ({ roomId }) => {
            handleLeave(socket, roomId)
        })

        socket.on('disconnect', () => {
            if (socket.data.roomId) {
                handleLeave(socket, socket.data.roomId)
            }
        })

        function handleLeave(socket, roomId) {
            socket.to(roomId).emit('user-left', { socketId: socket.id })
            const room = rooms.get(roomId)
            if (room) {
                room.delete(socket.id)
                if (room.size === 0) rooms.delete(roomId)
            }
            socket.leave(roomId)
        }
    })
}