import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext.jsx'

const Navbar = ({ onSwitchRole }) => {
  const navigate = useNavigate()

  // ✅ FIX: Only depend on token for showing/hiding the button.
  //    Don't gate on userData — it loads async and causes the button to vanish.
  const { token, setToken, userData } = useContext(AppContext)

  const [showMenu, setShowMenu] = useState(false)

  const logout = () => {
    setToken(false)
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-gray-400'>

      {/* Logo */}
      <img
        onClick={() => navigate('/')}
        className='w-44 cursor-pointer'
        src={assets.logo}
        alt='Prescripto'
      />

      <ul className='flex items-center gap-5 font-medium'>
        <NavLink to='/'>
          {({ isActive }) => (
            <li className='py-1 list-none'>
              HOME
              <hr className={`border-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? 'block' : 'invisible'}`} />
            </li>
          )}
        </NavLink>
        <NavLink to='/doctors'>
          {({ isActive }) => (
            <li className='py-1 list-none'>
              ALL DOCTORS
              <hr className={`border-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? 'block' : 'invisible'}`} />
            </li>
          )}
        </NavLink>
        <NavLink to='/about'>
          {({ isActive }) => (
            <li className='py-1 list-none'>
              ABOUT
              <hr className={`border-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? 'block' : 'invisible'}`} />
            </li>
          )}
        </NavLink>
        <NavLink to='/contact'>
          {({ isActive }) => (
            <li className='py-1 list-none'>
              CONTACT
              <hr className={`border-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? 'block' : 'invisible'}`} />
            </li>
          )}
        </NavLink>
      </ul>

      <div className='flex items-center gap-4'>

        {/* ✅ FIX: Check token only (not token && userData).
            Show a loading avatar if token exists but userData hasn't loaded yet. */}
        {token
          ? (
            <div className='flex items-center gap-2 cursor-pointer group relative'>
              {/* Show profile image once loaded, fallback to placeholder */}
              <img
                className='w-8 rounded-full'
                src={userData?.image || assets.profile_pic}
                alt=''
              />
              <img className='w-2.5' src={assets.dropdown_icon} alt='' />

              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>
                    My Profile
                  </p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>
                    My Appointments
                  </p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>
                    Logout
                  </p>
                  {onSwitchRole && (
                    <p onClick={onSwitchRole} className='hover:text-black cursor-pointer text-gray-400'>
                      ⇄ Switch Role
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
          : (
            // ✅ FIX: Always visible when no token — navigate to /login
            <button
              onClick={() => navigate('/login')}
              className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'
            >
              Create account
            </button>
          )
        }

        {/* Switch Role button (when not logged in) */}
        {onSwitchRole && !token && (
          <button
            onClick={onSwitchRole}
            className='text-xs border px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 hidden md:block'
          >
            ⇄ Switch Role
          </button>
        )}

        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden'
          src={assets.menu_icon}
          alt=''
        />

        {/* Mobile Menu */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt='' />
            <img className='w-7' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt='' />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'>
              <p className='px-4 py-2 rounded inline-block'>HOME</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors'>
              <p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'>
              <p className='px-4 py-2 rounded inline-block'>ABOUT</p>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'>
              <p className='px-4 py-2 rounded inline-block'>CONTACT</p>
            </NavLink>

            {/* ✅ Mobile: show Create Account button if not logged in */}
            {!token && (
              <p
                onClick={() => { navigate('/login'); setShowMenu(false) }}
                className='px-4 py-2 text-primary font-semibold cursor-pointer'
              >
                Create Account
              </p>
            )}

            {onSwitchRole && (
              <p onClick={onSwitchRole} className='px-4 py-2 text-gray-400 cursor-pointer'>
                ⇄ Switch Role
              </p>
            )}
          </ul>
        </div>

      </div>
    </div>
  )
}

export default Navbar