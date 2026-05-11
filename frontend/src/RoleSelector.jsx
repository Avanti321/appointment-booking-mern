// frontend/src/RoleSelector.jsx - REPLACE existing file

import React from 'react'

const RoleSelector = ({ onSelect }) => {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4'>

      {/* Logo */}
      <div className='flex flex-col items-center mb-10'>
        <div className='bg-white border border-gray-200 rounded-2xl px-8 py-4 flex items-center gap-4 shadow-sm mb-3'>
          <div className='w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center'>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-800 tracking-wide'>HEALTHQ</p>
            <p className='text-xs text-gray-400 tracking-widest'>HEALTH MANAGEMENT SYSTEM</p>
          </div>
        </div>
        <p className='text-sm text-gray-500'>Fast, secure & simple appointment booking</p>
      </div>

      {/* Divider */}
      <div className='flex items-center gap-3 w-full max-w-lg mb-6'>
        <hr className='flex-1 border-gray-200' />
        <span className='text-xs text-gray-400'>choose your role to continue</span>
        <hr className='flex-1 border-gray-200' />
      </div>

      {/* Role Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg'>

        {/* Patient */}
        <button
          onClick={() => onSelect('patient')}
          className='bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-[#1D9E75] hover:-translate-y-1 transition-all duration-200 group text-left'
        >
          <span className='text-xs px-3 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56] font-medium'>Patient</span>
          <div className='w-14 h-14 rounded-full bg-[#E1F5EE] flex items-center justify-center'>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-800 text-center'>Patient</p>
            <p className='text-xs text-gray-400 text-center mt-1 leading-relaxed'>Book appointments & view prescriptions</p>
          </div>
          <div className='w-full mt-1 py-1.5 rounded-lg border border-[#1D9E75] text-[#0F6E56] text-xs text-center'>
            Get started →
          </div>
        </button>

        {/* Doctor */}
        <button
          onClick={() => onSelect('doctor')}
          className='bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-[#378ADD] hover:-translate-y-1 transition-all duration-200 group text-left'
        >
          <span className='text-xs px-3 py-0.5 rounded-full bg-[#E6F1FB] text-[#185FA5] font-medium'>Doctor</span>
          <div className='w-14 h-14 rounded-full bg-[#E6F1FB] flex items-center justify-center'>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-800 text-center'>Doctor</p>
            <p className='text-xs text-gray-400 text-center mt-1 leading-relaxed'>Manage appointments & write prescriptions</p>
          </div>
          <div className='w-full mt-1 py-1.5 rounded-lg border border-[#378ADD] text-[#185FA5] text-xs text-center'>
            Sign in →
          </div>
        </button>

        {/* Admin */}
        <button
          onClick={() => onSelect('admin')}
          className='bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-[#7F77DD] hover:-translate-y-1 transition-all duration-200 group text-left'
        >
          <span className='text-xs px-3 py-0.5 rounded-full bg-[#EEEDFE] text-[#534AB7] font-medium'>Admin</span>
          <div className='w-14 h-14 rounded-full bg-[#EEEDFE] flex items-center justify-center'>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-800 text-center'>Admin</p>
            <p className='text-xs text-gray-400 text-center mt-1 leading-relaxed'>Manage doctors & platform settings</p>
          </div>
          <div className='w-full mt-1 py-1.5 rounded-lg border border-[#7F77DD] text-[#534AB7] text-xs text-center'>
            Sign in →
          </div>
        </button>

      </div>

      <p className='text-xs text-gray-400 mt-10'>© 2026 Prescripto. All rights reserved.</p>
    </div>
  )
}

export default RoleSelector