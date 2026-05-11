// frontend/src/App.jsx - REPLACE existing file

import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useContext } from 'react'

import RoleSelector     from './RoleSelector.jsx'
import { AdminContext }  from './context/AdminContext.jsx'
import { DoctorContext } from './context/DoctorContext.jsx'

// Patient pages
import Home           from './pages/Home'
import Doctors        from './pages/Doctors'
import Login          from './pages/Login'
import About          from './pages/About'
import Contact        from './pages/Contact'
import MyProfile      from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment    from './pages/Appointment'
import Navbar         from './components/Navbar'
import Footer         from './components/Footer'

// Admin/Doctor pages
import AdminLogin         from './pages/admin/Login.jsx'
import AdminNavbar        from './components/admin/Navbar.jsx'
import AdminSidebar       from './components/admin/Sidebar.jsx'
import Dashboard          from './pages/admin/Dashboard.jsx'
import AllAppointments    from './pages/admin/AllAppointments.jsx'
import AddDoctor          from './pages/admin/AddDoctor.jsx'
import DoctorsList        from './pages/admin/DoctorsList.jsx'
import DoctorDashboard    from './pages/doctor/DoctorDashboard.jsx'
import DoctorAppointments from './pages/doctor/DoctorAppointments.jsx'
import DoctorProfile      from './pages/doctor/DoctorProfile.jsx'

// ── Patient App ───────────────────────────────────────────────────────────────
const PatientApp = ({ onSwitchRole }) => (
    <div className='mx-4 sm:mx-[10%]'>
        <ToastContainer />
        <Navbar onSwitchRole={onSwitchRole} />
        <Routes>
            <Route path='/'                    element={<Home />} />
            <Route path='/doctors'             element={<Doctors />} />
            <Route path='/doctors/:speciality' element={<Doctors />} />
            <Route path='/login'               element={<Login />} />
            <Route path='/about'               element={<About />} />
            <Route path='/contact'             element={<Contact />} />
            <Route path='/my-profile'          element={<MyProfile />} />
            <Route path='/my-appointments'     element={<MyAppointments />} />
            <Route path='/appointment/:docId'  element={<Appointment />} />
        </Routes>
        <Footer />
    </div>
)

// ── Admin/Doctor App ──────────────────────────────────────────────────────────
const AdminDoctorApp = ({ onSwitchRole, loginRole }) => {
    const { aToken } = useContext(AdminContext)
    const { dToken }  = useContext(DoctorContext)

    return aToken || dToken ? (
        <div className='bg-[#F8F9FD] min-h-screen'>
            <ToastContainer />
            <AdminNavbar onSwitchRole={onSwitchRole} />
            <div className='flex items-start'>
                <AdminSidebar />
                <Routes>
                    <Route path='/'                    element={<></>} />
                    <Route path='/admin-dashboard'     element={<Dashboard />} />
                    <Route path='/all-appointments'    element={<AllAppointments />} />
                    <Route path='/add-doctor'          element={<AddDoctor />} />
                    <Route path='/doctor-list'         element={<DoctorsList />} />
                    <Route path='/doctor-dashboard'    element={<DoctorDashboard />} />
                    <Route path='/doctor-appointments' element={<DoctorAppointments />} />
                    <Route path='/doctor-profile'      element={<DoctorProfile />} />
                </Routes>
            </div>
        </div>
    ) : (
        <>
            {/* Pass loginRole so login page shows correct tab */}
            <AdminLogin onSwitchRole={onSwitchRole} defaultRole={loginRole} />
            <ToastContainer />
        </>
    )
}

// ── Root App ──────────────────────────────────────────────────────────────────
const App = () => {
    const [role, setRole] = useState(localStorage.getItem('appRole') || null)
    const navigate = useNavigate()

    const handleSelectRole = (selectedRole) => {
        localStorage.setItem('appRole', selectedRole)
        setRole(selectedRole)
        navigate('/')
    }

    const handleSwitchRole = () => {
        localStorage.removeItem('appRole')
        localStorage.removeItem('token')
        localStorage.removeItem('aToken')
        localStorage.removeItem('dToken')
        setRole(null)
        navigate('/')
    }

    if (!role) return <RoleSelector onSelect={handleSelectRole} />
    if (role === 'patient') return <PatientApp onSwitchRole={handleSwitchRole} />

    // Pass loginRole so doctor sees Doctor tab, admin sees Admin tab by default
    return <AdminDoctorApp onSwitchRole={handleSwitchRole} loginRole={role} />
}

export default App