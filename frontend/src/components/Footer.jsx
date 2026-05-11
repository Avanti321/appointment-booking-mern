import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='md:mx-10'>

            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                {/* --------Left Section------- */}
                <div>
                    <img className='mb-5 w-40' src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 loading-6'>Welcome to HealthQ Dashboard.
                        Track patient activity, monitor appointments, and analyze data effortlessly.
                        Designed to simplify workflows and improve productivity.
                        Your smart healthcare management solution.</p>

                </div>

                {/* --------Center Section------- */}
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>Home</li>
                        <li>About us</li>
                        <li>Delivery</li>
                        <li>Privacy policy</li>
                    </ul>

                </div>

                {/* --------Right Section------- */}
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul>
                        <li>+91 8796754784</li>
                        <li>healthQ010@gmail.com</li>
                    </ul>
                </div>
            </div>

            {/* -----Copyrights----- */}
            <div>
                <hr />
                <p className='py-5 text-sm text-center'>Copyright 2026@ Appointment-Booking-mern All Right Reserved.</p>
            </div>

        </div>
    )
}

export default Footer
