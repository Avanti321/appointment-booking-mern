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
  const [activeCall, setActiveCall]     = useState(null) // { roomId, appointmentId }
  const [viewRx, setViewRx]             = useState(null) // prescription object

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  // ── Fetch appointments ──────────────────────────────────────────────────────
  const getUserAppointments = async () => {
    try {
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
    }
  }

  useEffect(() => {
    if (token) getUserAppointments()
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
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>

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

export default MyAppointments