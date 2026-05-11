// frontend/src/components/VideoCall.jsx
// Copy this same file to admin/src/components/VideoCall.jsx too

import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const VideoCall = ({ roomId, appointmentId, role, userId, onEnd }) => {

    const localVideoRef  = useRef(null)
    const remoteVideoRef = useRef(null)
    const [status,   setStatus]   = useState('Connecting…')
    const [isMuted,  setIsMuted]  = useState(false)
    const [isCamOff, setIsCamOff] = useState(false)

    // These refs are used by controls (mute/camera/end)
    const socketRef      = useRef(null)
    const pcRef          = useRef(null)
    const localStreamRef = useRef(null)

    useEffect(() => {
        // All variables declared here — no closure issues
        let socket = null
        let pc = null
        let localStream = null
        let remoteSocketId = null

        const ICE_SERVERS = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }

        const createPeerConnection = (stream) => {
            const peerConn = new RTCPeerConnection(ICE_SERVERS)

            // Add local tracks to connection
            stream.getTracks().forEach(track => peerConn.addTrack(track, stream))

            // Send ICE candidates to remote peer
            peerConn.onicecandidate = ({ candidate }) => {
                if (candidate && remoteSocketId && socket) {
                    socket.emit('ice-candidate', { candidate, to: remoteSocketId })
                }
            }

            // When remote stream arrives show it
            peerConn.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                }
                setStatus('Connected ✅')
            }

            pc = peerConn
            pcRef.current = peerConn
            return peerConn
        }

        const start = async () => {
            // Step 1: connect socket
            socket = io(BACKEND_URL)
            socketRef.current = socket

            // Step 2: get camera and mic
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            localStreamRef.current = localStream
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream

            // Step 3: join the room
            socket.emit('join-room', { roomId, userId, role })
            setStatus('Waiting for other participant…')

            // Step 4: someone else joined → doctor sends offer
            socket.on('user-joined', async ({ socketId }) => {
                remoteSocketId = socketId
                setStatus('Participant joined, starting call…')
                if (role === 'doctor') {
                    const peerConn = createPeerConnection(localStream)
                    const offer = await peerConn.createOffer()
                    await peerConn.setLocalDescription(offer)
                    socket.emit('offer', { roomId, offer, to: socketId })
                }
            })

            // Step 5: patient receives offer → sends answer
            socket.on('offer', async ({ offer, from }) => {
                remoteSocketId = from
                const peerConn = createPeerConnection(localStream)
                await peerConn.setRemoteDescription(new RTCSessionDescription(offer))
                const answer = await peerConn.createAnswer()
                await peerConn.setLocalDescription(answer)
                socket.emit('answer', { answer, to: from })
            })

            // Step 6: doctor receives answer
            socket.on('answer', async ({ answer }) => {
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer))
                }
            })

            // Step 7: ICE candidates from remote
            socket.on('ice-candidate', async ({ candidate }) => {
                try {
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
                } catch (_) {}
            })

            // Step 8: other person left
            socket.on('user-left', () => {
                setStatus('Other participant left the call')
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
            })
        }

        start().catch(err => {
            console.error('VideoCall setup error:', err)
            setStatus('Error: ' + err.message)
        })

        // Cleanup when component unmounts
        return () => {
            if (socket) { socket.emit('leave-room', { roomId }); socket.disconnect() }
            if (localStream) localStream.getTracks().forEach(t => t.stop())
            if (pc) pc.close()
        }

    }, [roomId]) // only re-run if roomId changes

    // ── Controls ──────────────────────────────────────────────────────────────
    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0]
        if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled) }
    }

    const toggleCamera = () => {
        const track = localStreamRef.current?.getVideoTracks()[0]
        if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled) }
    }

    const handleEnd = async () => {
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { roomId })
            socketRef.current.disconnect()
        }
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
        if (pcRef.current) pcRef.current.close()

        try {
            const token = localStorage.getItem(role === 'doctor' ? 'dToken' : 'token')
            await fetch(`${BACKEND_URL}/api/video/end-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', [role === 'doctor' ? 'dToken' : 'token']: token },
                body: JSON.stringify({ appointmentId })
            })
        } catch (_) {}

        onEnd?.()
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <div className='fixed inset-0 bg-black z-50 flex flex-col items-center justify-center'>

            {/* Status bar */}
            <p className='absolute top-4 text-white text-sm bg-black/50 px-4 py-1 rounded-full z-10'>
                {status}
            </p>

            {/* Remote video - large */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className='w-full h-full object-cover'
            />

            {/* Local video - small corner */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className='absolute bottom-24 right-4 w-36 h-28 rounded-xl border-2 border-white object-cover shadow-lg'
            />

            {/* Control buttons */}
            <div className='absolute bottom-8 flex gap-4'>
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                <button
                    onClick={handleEnd}
                    className='w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg'
                >
                    📵
                </button>

                <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition ${isCamOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isCamOff ? '🚫' : '📷'}
                </button>
            </div>
        </div>
    )
}

export default VideoCall