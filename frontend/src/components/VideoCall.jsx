// frontend/src/components/VideoCall.jsx
// Copy this same file to admin/src/components/VideoCall.jsx too

import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const VideoCall = ({ roomId, appointmentId, role, userId, onEnd }) => {

    const localVideoRef  = useRef(null)
    const remoteVideoRef = useRef(null)

    const [status,      setStatus]      = useState('Connecting…')
    const [isMuted,     setIsMuted]     = useState(false)
    const [isCamOff,    setIsCamOff]    = useState(false)

    // ── Chat state ────────────────────────────────────────────────────────────
    const [chatOpen,    setChatOpen]    = useState(false)
    const [messages,    setMessages]    = useState([])
    const [inputMsg,    setInputMsg]    = useState('')
    const [unreadCount, setUnreadCount] = useState(0)
    const chatBottomRef                 = useRef(null)
    // ─────────────────────────────────────────────────────────────────────────

    const socketRef      = useRef(null)
    const pcRef          = useRef(null)
    const localStreamRef = useRef(null)

    // ── Auto-scroll chat to latest message ───────────────────────────────────
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Main WebRTC + Socket setup ────────────────────────────────────────────
    useEffect(() => {
        let socket        = null
        let pc            = null
        let localStream   = null
        let remoteSocketId = null

        const ICE_SERVERS = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }

        const createPeerConnection = (stream) => {
            const peerConn = new RTCPeerConnection(ICE_SERVERS)

            stream.getTracks().forEach(track => peerConn.addTrack(track, stream))

            peerConn.onicecandidate = ({ candidate }) => {
                if (candidate && remoteSocketId && socket) {
                    socket.emit('ice-candidate', { candidate, to: remoteSocketId })
                }
            }

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
            setStatus(role === 'doctor' ? 'Waiting for patient to join…' : 'Connecting to doctor…')

            // Second person to join: receives existing-user and sends the offer
            socket.on('existing-user', async ({ socketId }) => {
                remoteSocketId = socketId
                setStatus('Other participant found, starting call…')
                const peerConn = createPeerConnection(localStream)
                const offer = await peerConn.createOffer()
                await peerConn.setLocalDescription(offer)
                socket.emit('offer', { roomId, offer, to: socketId })
            })

            // First person: notified that second person joined — just store id and wait
            socket.on('user-joined', ({ socketId }) => {
                remoteSocketId = socketId
                setStatus('Other participant joined, connecting…')
            })

            // Room already has 2 people
            socket.on('room-full', () => {
                setStatus('This call is private — room is full.')
            })

            // First person receives offer → sends answer
            socket.on('offer', async ({ offer, from }) => {
                remoteSocketId = from
                const peerConn = createPeerConnection(localStream)
                await peerConn.setRemoteDescription(new RTCSessionDescription(offer))
                const answer = await peerConn.createAnswer()
                await peerConn.setLocalDescription(answer)
                socket.emit('answer', { answer, to: from })
            })

            // Second person receives answer
            socket.on('answer', async ({ answer }) => {
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
            })

            // ICE candidates
            socket.on('ice-candidate', async ({ candidate }) => {
                try {
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
                } catch (_) {}
            })

            // Other person left
            socket.on('user-left', () => {
                setStatus('Other participant left the call')
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
            })

            // ── Receive chat message from other participant ────────────────────
            socket.on('chat-message', ({ message, senderRole, senderName, timestamp }) => {
                const newMsg = {
                    text:      message,
                    sender:    'them',
                    role:      senderRole,
                    name:      senderName,
                    timestamp,
                    id:        Date.now() + Math.random()
                }
                setMessages(prev => [...prev, newMsg])

                // If chat panel is closed → increment unread badge
                // We use a functional update on chatOpen to read its latest value
                setChatOpen(isOpen => {
                    if (!isOpen) setUnreadCount(c => c + 1)
                    return isOpen
                })
            })
            // ─────────────────────────────────────────────────────────────────
        }

        start().catch(err => {
            console.error('VideoCall setup error:', err)
            setStatus('Error: ' + err.message)
        })

        // Cleanup when component unmounts
        return () => {
            if (socket)      { socket.emit('leave-room', { roomId }); socket.disconnect() }
            if (localStream) localStream.getTracks().forEach(t => t.stop())
            if (pc)          pc.close()
        }

    }, [roomId])

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
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [role === 'doctor' ? 'dToken' : 'token']: token
                },
                body: JSON.stringify({ appointmentId })
            })
        } catch (_) {}

        onEnd?.()
    }

    // ── Chat helpers ──────────────────────────────────────────────────────────
    const sendMessage = () => {
        const text = inputMsg.trim()
        if (!text || !socketRef.current) return

        // Add to local list immediately (optimistic UI)
        setMessages(prev => [...prev, {
            text,
            sender:    'me',
            role,
            name:      role === 'doctor' ? 'Doctor' : 'You',
            timestamp: new Date().toISOString(),
            id:        Date.now() + Math.random()
        }])

        // Broadcast to the other participant via existing socket
        socketRef.current.emit('chat-message', {
            roomId,
            message:    text,
            senderRole: role,
            senderName: role === 'doctor' ? 'Doctor' : 'Patient'
        })

        setInputMsg('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const openChat = () => {
        setChatOpen(true)
        setUnreadCount(0)   // clear badge when chat panel opens
    }

    const formatTime = (iso) => {
        try {
            return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (_) { return '' }
    }

    // Render plain text with clickable URLs
    const renderMessage = (text) =>
        text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
            /^https?:\/\//.test(part)
                ? <a key={i} href={part} target='_blank' rel='noreferrer'
                    className='underline text-blue-300 break-all'>{part}</a>
                : part
        )
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className='fixed inset-0 bg-black z-50 flex'>

            {/* ── Left: Video area ─────────────────────────────────────────── */}
            <div className='relative flex-1 flex flex-col items-center justify-center'>

                {/* Status bar */}
                <p className='absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-1 rounded-full z-10 whitespace-nowrap'>
                    {status}
                </p>

                {/* Remote video — large */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className='w-full h-full object-cover'
                />

                {/* Local video — small corner pip */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className='absolute bottom-24 right-4 w-36 h-28 rounded-xl border-2 border-white object-cover shadow-lg'
                />

                {/* Control buttons */}
                <div className='absolute bottom-8 flex gap-4 items-center'>

                    {/* Mute */}
                    <button
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition
                            ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>

                    {/* End call */}
                    <button
                        onClick={handleEnd}
                        title='End call'
                        className='w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg'
                    >
                        📵
                    </button>

                    {/* Camera */}
                    <button
                        onClick={toggleCamera}
                        title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition
                            ${isCamOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {isCamOff ? '🚫' : '📷'}
                    </button>

                    {/* Chat toggle — with unread badge */}
                    <button
                        onClick={chatOpen ? () => setChatOpen(false) : openChat}
                        title='Chat'
                        className='relative w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-xl shadow-lg transition'
                    >
                        💬
                        {unreadCount > 0 && (
                            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse'>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                </div>
            </div>
            {/* ── End video area ────────────────────────────────────────────── */}

            {/* ── Right: Chat sidebar ──────────────────────────────────────── */}
            {chatOpen && (
                <div className='w-80 bg-gray-900 flex flex-col border-l border-gray-700 animate-slide-in'>

                    {/* Header */}
                    <div className='flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0'>
                        <div className='flex items-center gap-2'>
                            <span className='text-white text-sm font-semibold'>💬 In-Call Chat</span>
                            <span className='w-2 h-2 rounded-full bg-green-400'></span>
                        </div>
                        <button
                            onClick={() => setChatOpen(false)}
                            className='text-gray-400 hover:text-white text-lg leading-none transition'
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className='flex-1 overflow-y-auto px-3 py-3 space-y-3'>

                        {messages.length === 0 ? (
                            <div className='flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs px-6 gap-3'>
                                <span className='text-4xl'>💬</span>
                                <p className='font-medium text-gray-400'>No messages yet</p>
                                <p>Share links, notes, or instructions here during the call.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                                >
                                    {/* Sender label + time */}
                                    <span className='text-[10px] text-gray-400 mb-0.5 px-1'>
                                        {msg.sender === 'me'
                                            ? 'You'
                                            : msg.role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'
                                        }
                                        {' · '}{formatTime(msg.timestamp)}
                                    </span>

                                    {/* Bubble */}
                                    <div className={`max-w-[85%] px-3 py-2 text-sm break-words leading-relaxed
                                        ${msg.sender === 'me'
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                            : 'bg-gray-700 text-gray-100 rounded-2xl rounded-bl-sm'
                                        }`}
                                    >
                                        {renderMessage(msg.text)}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Auto-scroll anchor */}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* Input area */}
                    <div className='px-3 py-3 border-t border-gray-700 flex-shrink-0'>
                        <div className='flex gap-2 items-end'>
                            <textarea
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder='Type a message…'
                                rows={2}
                                className='flex-1 bg-gray-800 text-white text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500'
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMsg.trim()}
                                title='Send'
                                className='w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 flex items-center justify-center text-white text-lg transition flex-shrink-0'
                            >
                                ➤
                            </button>
                        </div>
                        <p className='text-[10px] text-gray-500 mt-1.5 text-center'>
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>

                </div>
            )}
            {/* ── End chat sidebar ─────────────────────────────────────────── */}

        </div>
    )
}

export default VideoCall