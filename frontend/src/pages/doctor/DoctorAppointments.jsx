// frontend/src/pages/doctor/DoctorAppointments.jsx

import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext.jsx'
import { AppContext } from '../../context/AppContext.jsx'
import { assets } from '../../assets/admin_assets/assets.js'
import axios from 'axios'
import { toast } from 'react-toastify'
import VideoCall from '../../components/admin/VideoCall.jsx'

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', instructions: '' }

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment } = useContext(DoctorContext)
  const { calculateAge, slotDateFormat, currency, backendUrl } = useContext(AppContext)

  const [activeCall, setActiveCall] = useState(null)
  const [rxModal,    setRxModal]    = useState(null)
  const [diagnosis,  setDiagnosis]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [medicines,  setMedicines]  = useState([{ ...emptyMed }])
  const [rxSaving,   setRxSaving]   = useState(false)

  useEffect(() => {
    if (dToken) getAppointments()
  }, [dToken])

  const startVideoCall = async (appointment) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/video/create-room',
        { appointmentId: appointment._id },
        { headers: { dToken } }
      )
      if (data.success) {
        setActiveCall({ roomId: data.roomId, appointmentId: appointment._id })
        toast.success('Video room ready! Patient can now join.')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const openRxModal = (appointmentId) => {
    setRxModal(appointmentId)
    setDiagnosis('')
    setNotes('')
    setMedicines([{ ...emptyMed }])
  }

  const addMedRow    = () => setMedicines(prev => [...prev, { ...emptyMed }])
  const removeMedRow = (i) => setMedicines(prev => prev.filter((_, idx) => idx !== i))
  const updateMed    = (i, field, value) =>
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))

  const savePrescription = async () => {
    if (!medicines[0].name) { toast.error('Add at least one medicine.'); return }
    setRxSaving(true)
    try {
      const { data } = await axios.post(
        backendUrl + '/api/prescription/create',
        { appointmentId: rxModal, medicines, diagnosis, notes },
        { headers: { dToken } }
      )
      if (data.success) {
        toast.success('Prescription saved!')
        setRxModal(null)
        getAppointments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRxSaving(false)
    }
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      {activeCall && (
        <VideoCall
          roomId={activeCall.roomId}
          appointmentId={activeCall.appointmentId}
          role="doctor"
          userId={dToken}
          onEnd={() => { setActiveCall(null); getAppointments() }}
        />
      )}

      {rxModal && (
        <PrescriptionModal
          medicines={medicines}
          diagnosis={diagnosis}
          notes={notes}
          setDiagnosis={setDiagnosis}
          setNotes={setNotes}
          onAddRow={addMedRow}
          onRemoveRow={removeMedRow}
          onUpdateMed={updateMed}
          onSave={savePrescription}
          onClose={() => setRxModal(null)}
          saving={rxSaving}
        />
      )}

      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_2fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p><p>Patient</p><p>Payment</p><p>Age</p><p>Date & Time</p><p>Fees</p><p>Actions</p><p>Status</p>
        </div>

        {appointments.reverse().map((item, index) => (
          <div key={index} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_2fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData.image} alt='' />
              <p>{item.userData.name}</p>
            </div>
            <div>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.payment ? 'Online' : 'CASH'}
              </p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p>{currency}{item.amount}</p>

            <div className='flex flex-col gap-1'>
              {!item.cancelled && !item.isCompleted && (
                <button onClick={() => startVideoCall(item)} className='text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition'>
                  📹 {item.videoRoomId ? 'Rejoin Call' : 'Start Call'}
                </button>
              )}
              {!item.cancelled && (
                <button onClick={() => openRxModal(item._id)} className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition'>
                  📋 {item.prescription ? 'Edit Rx' : 'Add Rx'}
                </button>
              )}
            </div>

            {item.cancelled
              ? <p className='text-red-500 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <div className='flex'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt='' />
                    <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt='' />
                  </div>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

const PrescriptionModal = ({ medicines, diagnosis, notes, setDiagnosis, setNotes, onAddRow, onRemoveRow, onUpdateMed, onSave, onClose, saving }) => (
  <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-xl font-semibold text-gray-800'>📋 Write Prescription</h2>
        <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl'>✕</button>
      </div>
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Diagnosis</label>
        <input type='text' className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary' placeholder='e.g. Acute pharyngitis' value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
      </div>
      <div className='mb-4'>
        <div className='flex justify-between items-center mb-2'>
          <label className='text-sm font-medium text-gray-700'>Medicines</label>
          <button onClick={onAddRow} className='text-xs px-3 py-1 bg-primary text-white rounded-full hover:opacity-90'>+ Add Medicine</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-100 text-gray-600'>
                <th className='text-left px-2 py-2'>Name *</th>
                <th className='text-left px-2 py-2'>Dosage *</th>
                <th className='text-left px-2 py-2'>Frequency *</th>
                <th className='text-left px-2 py-2'>Duration *</th>
                <th className='text-left px-2 py-2'>Instructions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, i) => (
                <tr key={i} className='border-b'>
                  {['name', 'dosage', 'frequency', 'duration', 'instructions'].map(field => (
                    <td key={field} className='px-2 py-1'>
                      <input type='text' className='w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                        placeholder={field === 'name' ? 'Paracetamol' : field === 'dosage' ? '500mg' : field === 'frequency' ? '3x daily' : field === 'duration' ? '5 days' : 'After meals'}
                        value={med[field]} onChange={e => onUpdateMed(i, field, e.target.value)} />
                    </td>
                  ))}
                  <td className='px-2 py-1'>
                    {medicines.length > 1 && <button onClick={() => onRemoveRow(i)} className='text-red-400 hover:text-red-600 text-lg'>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className='mb-6'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Notes / Instructions</label>
        <textarea rows={3} className='w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Additional instructions for the patient…' value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className='flex gap-3 justify-end'>
        <button onClick={onClose} className='px-5 py-2 border rounded-lg text-sm hover:bg-gray-100'>Cancel</button>
        <button onClick={onSave} disabled={saving} className='px-5 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-60'>
          {saving ? 'Saving…' : 'Save Prescription'}
        </button>
      </div>
    </div>
  </div>
)

export default DoctorAppointments