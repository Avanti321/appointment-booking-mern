// frontend/src/components/admin/Navbar.jsx
// Copy of admin Navbar with "Switch Role" button added

import React, { useContext } from 'react'
import { assets } from '../../assets/admin_assets/assets'
import { AdminContext } from '../../context/AdminContext.jsx'
import { DoctorContext } from '../../context/DoctorContext.jsx'
import { useNavigate } from 'react-router-dom'

const AdminNavbar = ({ onSwitchRole }) => {
    const { aToken, setAToken } = useContext(AdminContext)
    const { dToken, setDToken } = useContext(DoctorContext)
    const navigate = useNavigate()

    const logout = () => {
        navigate('/')
        if (aToken) { setAToken(''); localStorage.removeItem('aToken') }
        if (dToken) { setDToken(''); localStorage.removeItem('dToken') }
    }

    return (
        <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
            <div className='flex items-center gap-2 text-xs'>
                <img className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt='' />
                <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>
                    {aToken ? 'Admin' : 'Doctor'}
                </p>
            </div>
            <div className='flex items-center gap-3'>
                <button
                    onClick={onSwitchRole}
                    className='text-sm px-4 py-2 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-100'
                >
                    ⇄ Switch Role
                </button>
                <button
                    onClick={logout}
                    className='bg-[#7F00FF] hover:bg-[#6a00cc] text-white text-sm px-10 py-2 rounded-full'
                >
                    Logout
                </button>
            </div>
        </div>
    )
}
export default AdminNavbar