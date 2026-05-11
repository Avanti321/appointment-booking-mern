// frontend/src/context/AppContext.jsx - REPLACE existing file

import { createContext, useEffect, useState } from "react"
import axios from 'axios'
import { toast } from 'react-toastify'

export const AppContext = createContext()

const AppContextProvider = ({ children }) => {

    const backendUrl     = import.meta.env.VITE_BACKEND_URL
    const currencySymbol = '₹'
    const currency       = '₹'   // admin pages use 'currency', patient pages use 'currencySymbol'

    const [doctors,  setDoctors]  = useState([])
    const [token,    setToken]    = useState(localStorage.getItem('token') || false)
    const [userData, setUserData] = useState(false)

    // ── Used by admin/doctor pages ────────────────────────────────────────────
    const calculateAge = (dob) => {
        const today     = new Date()
        const birthDate = new Date(dob)
        return today.getFullYear() - birthDate.getFullYear()
    }

    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    // ── API calls ─────────────────────────────────────────────────────────────
    const getDoctorsData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) setDoctors(data.doctors)
            else toast.error(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + '/api/user/get-profile',
                { headers: { token } }
            )
            if (data.success) setUserData(data.userData)
            else toast.error(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => { getDoctorsData() }, [])

    useEffect(() => {
        if (token) loadUserProfileData()
        else setUserData(false)
    }, [token])

    const value = {
        doctors, getDoctorsData,
        currencySymbol,
        currency,           // ← for admin pages
        calculateAge,       // ← for admin pages
        slotDateFormat,     // ← for admin pages
        token, setToken,
        backendUrl,
        userData, setUserData,
        loadUserProfileData
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContextProvider