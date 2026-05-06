import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const AppContext = createContext()

const AppContextProvider = ({ children }) => {

    const currencySymbol = '$'
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
    const [userData, setUserData] = useState(false)  // ✅ fixed typo: userDate → userData

    const getDoctorsData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
            if (data.success) {
                setUserData(data.userData)  // ✅ fixed: data.setUserData → data.userData
            } else {
                toast.error(data.message)
            }
        } catch (error) {           // ✅ fixed: catch(error) was missing
            console.log(error)
            toast.error(error.message)
        }
    }

    const value = {
        doctors,getDoctorsData,
        currencySymbol,
        token, setToken,
        backendUrl,
        userData, setUserData,          // ✅ added to context
        loadUserProfileData             // ✅ added to context
    }

    useEffect(() => {
        getDoctorsData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()   // ✅ load user data when token exists
        } else {
            setUserData(false)      // ✅ clear user data on logout
        }
    }, [token])

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContextProvider