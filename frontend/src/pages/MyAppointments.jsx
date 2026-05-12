// frontend/src/pages/MyAppointments.jsx
// REPLACE your existing MyAppointments.jsx with this file

import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import VideoCall from '../components/VideoCall'

const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [activeCall, setActiveCall]     = useState(null)
  const [viewRx, setViewRx]             = useState(null)
  const [ratingModal, setRatingModal]   = useState(null)
  const [refreshing, setRefreshing]     = useState(false)

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  // ── Fetch appointments ──────────────────────────────────────────────────────
  const getUserAppointments = async () => {
    try {
      setRefreshing(true)
      const { data } = await axios.get(
        backendUrl + '/api/user/appointments',
        { headers: { token } }
      )
      if (data.success) {
        setAppointments(data.appointments.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (token) {
      getUserAppointments()

      // Poll every 60s so the UI stays in sync with the cron job
      // that auto-completes appointments after their slot time passes
      const interval = setInterval(getUserAppointments, 60000)
      return () => clearInterval(interval)
    }
  }, [token])

  // ── Cancel appointment ──────────────────────────────────────────────────────
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // ── Razorpay payment ────────────────────────────────────────────────────────
  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            backendUrl + '/api/user/verifyRazorpay',
            response,
            { headers: { token } }
          )
          if (data.success) {
            toast.success('Payment Successful')
            getUserAppointments()
          } else {
            toast.error(data.message)
          }
        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }
      }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/payment-razorpay',
        { appointmentId },
        { headers: { token } }
      )
      if (data.success) {
        initPay(data.order)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // ── Video call ──────────────────────────────────────────────────────────────
  const joinVideoCall = async (appointment) => {
    try {
      const { data } = await axios.get(
        backendUrl + '/api/video/room/' + appointment._id,
        { headers: { token } }
      )
      if (data.success && data.roomId) {
        setActiveCall({ roomId: data.roomId, appointmentId: appointment._id })
      } else {
        toast.info("Video call not started by doctor yet. Please wait.")
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // ── Submit rating & review ──────────────────────────────────────────────────
  const submitReview = async (appointmentId, rating, review) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/submit-review',
        { appointmentId, rating, review },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Review submitted!')
        setRatingModal(null)
        getUserAppointments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // ── View prescription ───────────────────────────────────────────────────────
  const viewPrescription = async (appointmentId) => {
    try {
      const { data } = await axios.get(
        backendUrl + '/api/prescription/patient/' + appointmentId,
        { headers: { token } }
      )
      if (data.success && data.prescription) {
        setViewRx({ ...data.prescription, docData: data.docData, slotDate: data.slotDate, slotTime: data.slotTime })
      } else {
        toast.info("Prescription not available yet.")
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className='flex items-center justify-between pb-3 mt-12 border-b'>
        <p className='font-medium text-zinc-700'>My Appointments</p>
        <button
          onClick={getUserAppointments}
          disabled={refreshing}
          className='flex items-center gap-1 text-xs text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary hover:text-white transition-all duration-200 disabled:opacity-50'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill='none' viewBox='0 0 24 24' stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Video call fullscreen overlay ── */}
      {activeCall && (
        <VideoCall
          roomId={activeCall.roomId}
          appointmentId={activeCall.appointmentId}
          role="patient"
          userId={token}
          onEnd={() => { setActiveCall(null); getUserAppointments() }}
        />
      )}

      {/* ── Prescription modal ── */}
      {viewRx && (
        <PrescriptionModal rx={viewRx} onClose={() => setViewRx(null)} />
      )}

      {/* ── Rating modal ── */}
      {ratingModal && (
        <RatingModal
          docName={ratingModal.docName}
          onSubmit={(rating, review) => submitReview(ratingModal.appointmentId, rating, review)}
          onClose={() => setRatingModal(null)}
        />
      )}

      <div>
        {appointments.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>

            {/* Doctor Image */}
            <div>
              <img className='w-32 bg-indigo-50' src={item.docData.image} alt='' />
            </div>

            {/* Doctor Info */}
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-zinc-700 font-medium mt-1'>Address:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-xs mt-1'>
                <span className='text-sm text-neutral-700 font-medium'>Date & Time: </span>
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>

            <div></div>

            {/* ── Action Buttons ── */}
            <div className='flex flex-col gap-2 justify-end'>

              {/* 1. Payment Done badge */}
              {!item.cancelled && item.payment && !item.isCompleted && (
                <button className='text-sm text-green-500 text-center sm:min-w-48 py-2 border border-green-500 rounded'>
                  Payment Done ✅
                </button>
              )}

              {/* 2. Pay Online — only if not paid */}
              {!item.cancelled && !item.payment && !item.isCompleted && (
                <button
                  onClick={() => appointmentRazorpay(item._id)}
                  className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-primary hover:text-white transition-all duration-300'
                >
                  Pay Online
                </button>
              )}

              {/* 3. Join Video Call — visible when doctor has started the call */}
              {!item.cancelled && !item.isCompleted && item.videoRoomId && (
                <button
                  onClick={() => joinVideoCall(item)}
                  className='text-sm text-center sm:min-w-48 py-2 border border-green-500 rounded text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300'
                >
                  📹 Join Video Call
                </button>
              )}

              {/* 4. View Prescription — visible once doctor has issued it */}
              {item.prescription && (
                <button
                  onClick={() => viewPrescription(item._id)}
                  className='text-sm text-center sm:min-w-48 py-2 border border-blue-500 rounded text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300'
                >
                  📋 View Prescription
                </button>
              )}

              {/* 5. Cancel */}
              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300'
                >
                  Cancel Appointment
                </button>
              )}

              {/* 6. Cancelled label */}
              {item.cancelled && !item.isCompleted && (
                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500 text-sm'>
                  Appointment Cancelled
                </button>
              )}

              {/* 7. Completed label */}
              {item.isCompleted && (
                <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>
                  Completed
                </button>
              )}

              {/* 8. Rate button — only after completion, before review submitted */}
              {item.isCompleted && !item.isReviewed && (
                <button
                  onClick={() => setRatingModal({ appointmentId: item._id, docName: item.docData.name })}
                  className='text-sm text-center sm:min-w-48 py-2 border border-yellow-400 rounded text-yellow-600 hover:bg-yellow-400 hover:text-white transition-all duration-300'
                >
                  ⭐ Rate Doctor
                </button>
              )}

              {/* 9. Already rated badge */}
              {item.isCompleted && item.isReviewed && (
                <div className='sm:min-w-48 py-2 text-center text-sm text-yellow-500 border border-yellow-300 rounded flex items-center justify-center gap-1'>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} Reviewed
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Prescription Modal (read-only for patient) ────────────────────────────────
const PrescriptionModal = ({ rx, onClose }) => {
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const formatDate = (slotDate) => {
    const d = slotDate.split('_')
    return d[0] + ' ' + months[Number(d[1])] + ' ' + d[2]
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8'>

        {/* Header */}
        <div className='flex items-start justify-between border-b pb-4 mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-primary'>PRESCRIPTO</h2>
            <p className='text-xs text-gray-400'>Digital Prescription</p>
          </div>
          <div className='text-right text-sm text-gray-500'>
            <p><strong>Date:</strong> {formatDate(rx.slotDate)}</p>
            <p><strong>Time:</strong> {rx.slotTime}</p>
          </div>
        </div>

        {/* Doctor info */}
        <div className='flex gap-4 mb-6'>
          <img src={rx.docData?.image} className='w-16 h-16 rounded-full object-cover' alt='' />
          <div>
            <p className='font-semibold text-gray-800'>{rx.docData?.name}</p>
            <p className='text-sm text-gray-500'>{rx.docData?.speciality}</p>
            <p className='text-xs text-gray-400'>{rx.docData?.degree} · {rx.docData?.experience} experience</p>
          </div>
        </div>

        {/* Diagnosis */}
        {rx.diagnosis && (
          <div className='mb-4'>
            <p className='text-sm font-semibold text-gray-700 mb-1'>Diagnosis</p>
            <p className='text-sm text-gray-600 bg-blue-50 rounded-lg px-4 py-2'>{rx.diagnosis}</p>
          </div>
        )}

        {/* Medicines table */}
        <div className='mb-4'>
          <p className='text-sm font-semibold text-gray-700 mb-2'>Medicines</p>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm border-collapse'>
              <thead>
                <tr className='bg-primary/10'>
                  <th className='text-left px-3 py-2'>Medicine</th>
                  <th className='text-left px-3 py-2'>Dosage</th>
                  <th className='text-left px-3 py-2'>Frequency</th>
                  <th className='text-left px-3 py-2'>Duration</th>
                  <th className='text-left px-3 py-2'>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {rx.medicines.map((med, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className='px-3 py-2 font-medium text-gray-800'>{med.name}</td>
                    <td className='px-3 py-2 text-gray-600'>{med.dosage}</td>
                    <td className='px-3 py-2 text-gray-600'>{med.frequency}</td>
                    <td className='px-3 py-2 text-gray-600'>{med.duration}</td>
                    <td className='px-3 py-2 text-gray-500 italic'>{med.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div className='mb-6'>
            <p className='text-sm font-semibold text-gray-700 mb-1'>Doctor's Notes</p>
            <p className='text-sm text-gray-600 bg-yellow-50 rounded-lg px-4 py-2 italic'>{rx.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-3 justify-end mt-4'>
          <button
            onClick={() => window.print()}
            className='px-4 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90'
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className='px-4 py-2 border text-sm rounded-lg hover:bg-gray-100'
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Rating Modal ──────────────────────────────────────────────────────────────
const RatingModal = ({ docName, onSubmit, onClose }) => {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)
  const [review, setReview] = useState('')

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  const handleSubmit = () => {
    if (!selectedStar) {
      return
    }
    onSubmit(selectedStar, review)
  }

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-8'>

        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-semibold text-gray-800'>Rate your Doctor</h2>
            <p className='text-sm text-gray-500 mt-0.5'>How was your experience with <span className='font-medium text-gray-700'>{docName}</span>?</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Star picker */}
        <div className='flex flex-col items-center mb-6'>
          <div className='flex gap-2 mb-2'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedStar(star)}
                className='text-4xl transition-transform hover:scale-110 focus:outline-none'
              >
                <span className={(hoveredStar || selectedStar) >= star ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              </button>
            ))}
          </div>
          <p className={`text-sm font-medium h-5 transition-all ${selectedStar ? 'text-yellow-500' : 'text-gray-400'}`}>
            {labels[hoveredStar || selectedStar] || 'Select a rating'}
          </p>
        </div>

        {/* Review text */}
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder='Share your experience (optional)...'
          rows={3}
          className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-primary mb-6'
        />

        {/* Actions */}
        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStar}
            className={`flex-1 py-3 rounded-full text-sm font-medium transition-all
              ${selectedStar ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Submit Review
          </button>
        </div>

      </div>
    </div>
  )
}

export default MyAppointments