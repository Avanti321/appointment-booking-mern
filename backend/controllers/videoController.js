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
    // rooms Map: roomId → Set of socketIds
    // Only ever 2 people allowed per room (doctor + patient)
    const rooms = new Map()

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id)

        // ── Join Room ─────────────────────────────────────────────────────────
        socket.on('join-room', ({ roomId, userId, role }) => {

            if (!rooms.has(roomId)) rooms.set(roomId, new Set())
            const room = rooms.get(roomId)

            // Enforce max 2 participants (doctor + patient only)
            if (room.size >= 2) {
                socket.emit('room-full')
                console.log(`Rejected ${role} — room ${roomId} is already full`)
                return
            }

            socket.join(roomId)
            socket.data.roomId  = roomId
            socket.data.userId  = userId
            socket.data.role    = role
            room.add(socket.id)

            console.log(`${role} joined room ${roomId}. Room size: ${room.size}`)

            if (room.size === 2) {
                // Tell the FIRST person (already waiting) that the second joined
                socket.to(roomId).emit('user-joined', {
                    socketId: socket.id,
                    userId,
                    role
                })

                // Tell the SECOND person (new joiner) about the first person
                // so the second joiner can initiate the WebRTC offer
                room.forEach(existingSocketId => {
                    if (existingSocketId !== socket.id) {
                        socket.emit('existing-user', { socketId: existingSocketId })
                    }
                })
            }
            // If room.size === 1, first person just waits silently
        })

        // ── WebRTC Signaling ──────────────────────────────────────────────────
        socket.on('offer', ({ roomId, offer, to }) => {
            socket.to(to).emit('offer', { offer, from: socket.id })
        })

        socket.on('answer', ({ answer, to }) => {
            socket.to(to).emit('answer', { answer, from: socket.id })
        })

        socket.on('ice-candidate', ({ candidate, to }) => {
            socket.to(to).emit('ice-candidate', { candidate, from: socket.id })
        })

        // ── Chat Message ──────────────────────────────────────────────────────
        // Receives a message from one participant and broadcasts it to the
        // other person in the same room only (not back to sender)
        socket.on('chat-message', ({ roomId, message, senderRole, senderName }) => {
            if (!message || !roomId) return
            socket.to(roomId).emit('chat-message', {
                message,
                senderRole,
                senderName,
                timestamp: new Date().toISOString()
            })
            console.log(`[Chat] ${senderRole} in room ${roomId}: ${message}`)
        })
        // ── End Chat ──────────────────────────────────────────────────────────

        // ── Leave / Disconnect ────────────────────────────────────────────────
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
                if (room.size === 0) rooms.delete(roomId)  // clean up empty rooms
            }
            socket.leave(roomId)
            console.log(`Socket ${socket.id} left room ${roomId}`)
        }
    })
}