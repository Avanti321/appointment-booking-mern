import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom"
import { AppContext } from "../context/AppContext.jsx"
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors.jsx'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {

  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [appointmentType, setAppointmentType] = useState('')

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  const getAvailableSlots = async () => {
    setDocSlots([])

    //getting current date
    let today = new Date()

    for (let i = 0, added = 0; added < 7; i++) {
      //getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      if (currentDate.getDay() === 0) continue
      added++

      //setting end time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)


      //setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      let timeSlots = []

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()

        const slotDate = day + "_" + month + "_" + year
        const slotTime = formattedTime

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true


        if (isSlotAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime
          })
        }

        //Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      setDocSlots(prev => ([...prev, timeSlots]))
    }
  }

  const handleBookClick = () => {
    if (!token) {
      toast.warn('Login to book appointment')
      return navigate('/login')
    }
    if (!slotTime) {
      toast.warn('Please select a time slot')
      return
    }
    setAppointmentType('')
    setShowModal(true)
  }



  const bookAppointment = async (type) => {
    try {
      const date = docSlots[slotIndex][0].datetime
      let day = date.getDate()
      let month = date.getMonth() + 1
      let year = date.getFullYear()

      const slotDate = day + "_" + month + "_" + year

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime, appointmentType: type }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const handleConfirm = () => {
    if (!appointmentType) {
      toast.warn('Please select an appointment type')
      return
    }
    bookAppointment(appointmentType)
  }

  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])


  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])


  useEffect(() => {
    console.log(docSlots);
  }, [docSlots])

  return docInfo && (
    <div>
      {/* ---------Doctor Details--------- */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:-mt-0'>
          {/* ---------Doc Info : name,degree,experience--------- */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>


          {/* --------- Doctor About ---------- */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
              About <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee:<span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>

      {/* -----------Booking Slots----------- */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking slots</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots.map((item, index) => (
              <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
          }
        </div>
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>

        <button onClick={handleBookClick} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 cursor-pointer'>Book an Appointment</button>
      </div>

      {/* ------Listing Related Doctors------ */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />

      {/* --------- Appointment Type modal ---------- */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center' style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>

          {/* Modal Header */}
          <div className='px-7 pt-7 pb-4 border-b border-gray-100 flex items-start justify-between'>
            <div>
              <h2 className='text-sl font-semibold text-gray-900'>Choose Appointment Type</h2>
              <p className='text-sm text-gray-500 mt-1'>Select how you would like to meet <span className='font-medium text-gray-700'>{docInfo.name}</span></p>
            </div>
            <button onClick={() => setShowModal(false)} className='text-gray-400 hover:text-gray-600 transition-colors mt-1 p-1 rounded-full hover:bg-gray-100'>
              <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cards */}
          <div className='p-6 flex flex-col sm:flex-row gap-4'>

            {/* Offline card */}
            <button onClick={() => setAppointmentType("offline")} className={`flex-1 text-left rounded-xl border-2 p-5 transition-all cursor-pointer group ${appointmentType === 'offline' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${appointmentType === 'offline' ? 'bg-primary' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${appointmentType === 'offline' ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className={`font-semibold text-base mb-1 ${appointmentType === 'offline' ? 'text-primary' : 'text-gray-800'}`}>
                Offline Appointment
              </p>
              <p className='text-xs text-gray-500 leading-relaxed'>OPD Visit — Visit the hospital or clinic in person to meet the doctor.</p>
              <div className='mt-4 flex flex-col gap-1.5'>
                {['In-person consultation', 'Physical examination', 'Prescriptions on-site'].map(f => (
                  <div key={f} className='flex items-center gap-2 text-xs text-gray-500'>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 ${appointmentType === 'offline' ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
              {appointmentType === 'offline' && (
                <div className='mt-4 flex items-center gap-1.5 text-xs font-medium text-primary'>
                  <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected
                </div>
              )}
            </button>

            {/* Online Card */}
            <button
              onClick={() => setAppointmentType('online')}
              className={`flex-1 text-left rounded-xl border-2 p-5 transition-all cursor-pointer group
                  ${appointmentType === 'online'
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all
                  ${appointmentType === 'online' ? 'bg-primary' : 'bg-gray-100 group-hover:bg-blue-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${appointmentType === 'online' ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className={`font-semibold text-base mb-1 ${appointmentType === 'online' ? 'text-primary' : 'text-gray-800'}`}>
                Online Appointment
              </p>
              <p className='text-xs text-gray-500 leading-relaxed'>Video Consultation — Consult the doctor from the comfort of your home.</p>

              <div className='mt-4 flex flex-col gap-1.5'>
                {['HD video consultation', 'No travel needed', 'Digital prescription'].map(f => (
                  <div key={f} className='flex items-center gap-2 text-xs text-gray-500'>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 ${appointmentType === 'online' ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>

              {appointmentType === 'online' && (
                <div className='mt-4 flex items-center gap-1.5 text-xs font-medium text-primary'>
                  <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          </div>

          {/* Summary + CTA */}
          <div className='px-6 pb-6'>
            {appointmentType && (
              <div className='mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-gray-700 flex items-center gap-3'>
                <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4 text-primary shrink-0' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  <span className='font-medium'>{appointmentType === 'offline' ? 'OPD Visit' : 'Video Consultation'}</span>
                  {' · '}{docInfo.name}
                  {' · '}{slotTime}
                </span>
              </div>
            )}

            <div className='flex gap-3'>
              <button
                onClick={() => setShowModal(false)}
                className='flex-1 py-3 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!appointmentType}
                className={`flex-1 py-3 rounded-full text-sm font-medium transition-all
                    ${appointmentType ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>

      )
      }

      {/* Modal animation keyframe */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div >
  )
}

export default Appointment
