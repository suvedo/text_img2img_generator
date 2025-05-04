import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

import LoginModal from './LoginModal'
import { API_BASE_URL } from '../config'
import { number } from 'motion'

export default function Navbar() {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const [creditsRemain, setCreditsRemain] = useState<number | undefined>(undefined)

  // const handleDropdown = () => {
    
  //   if (isDropdownOpen) {
  //     fetch(`${API_BASE_URL}/gen_img/get_credits/${session?.user.email}`, {
  //           method: 'GET',
  //           headers: {
  //             'Accept': 'application/json',
  //           }
  //         }).then((response) => {
  //           if (response.ok) {
  //             return response.json()
  //           } else {
  //             throw new Error('Network response was not ok')
  //           };
  //         }).then((data) => {
  //           setCreditsRemain(data.credits_remain)
  //         }).catch((error) => {
  //           setCreditsRemain(undefined)
  //           console.error(error);
  //         });
  //       }

  //   setIsDropdownOpen(!isDropdownOpen)
  // }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isDropdownOpen) {
      fetch(`${API_BASE_URL}/gen_img/get_credits/${session?.user.email}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }).then((response) => {
        if (response.ok) {
          return response.json()
        } else {
          throw new Error('Network response was not ok')
        };
      }).then((data) => {
        setCreditsRemain(data.credits_remain)
      }).catch((error) => {
        setCreditsRemain(undefined)
        console.error(error);
      });
    }
  }, [isDropdownOpen])

  return (
    <nav className={`navbar navbar-expand-lg navbar-light ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <Link href="/" className="navbar-brand">Home</Link>
          <Link href="#promptTemplates" className="nav-link">Prompt Templates</Link>
          <Link href="#myCreations" className="nav-link">My Creations</Link>
          <Link href="#userCases" className="nav-link">User Cases</Link>
          <Link href="#pricingAera" className="nav-link">Pricing</Link>

          {/* <button className="nav-link" id="pricingButton">Pricing</button> */}
        </div>
        <div className="d-flex align-items-center">
          {session ? (
            <div className="dropdown">
              <button 
                className="btn dropdown-toggle" 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {session.user.email}
              </button>
              <ul className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`}>
                <li>
                  <p className="dropdown-item"><b>{creditsRemain}</b> credits</p>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => signOut()}>Log out</button>
                </li>
              </ul>
          </div>
          ) : (
            <>
            <button className="nav-link mx-2" onClick={() => setIsLoginModalOpen(true)}>
              Log in
            </button>
            {/* <button className="nav-link" onClick={() => setIsLoginModalOpen(true)}>
              Sign up
            </button> */}
            <LoginModal 
              isOpen={isLoginModalOpen} 
              onClose={() => setIsLoginModalOpen(false)} 
            />
          </>
          )}
        </div>
      </div>
    </nav>
  )
}