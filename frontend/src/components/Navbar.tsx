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

  const [isLoadingCredits, setIsLoadingCredits] = useState(false)

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
      setIsLoadingCredits(true);
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
      }).finally(() => {
        setIsLoadingCredits(false);
      });
    }
  }, [isDropdownOpen])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 100; // 向上偏移的像素值,可以根据需要调整
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-light ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid">
      <div className="d-flex align-items-center">
        <Link href="/" className="navbar-brand">Home</Link>
        <a href="#promptTemplates" className="nav-link" onClick={(e) => handleNavClick(e, 'promptTemplates')}>
          Prompt Templates
        </a>
        <a href="#myCreations" className="nav-link" onClick={(e) => handleNavClick(e, 'myCreations')}>
          My Creations
        </a>
        <a href="#userCases" className="nav-link" onClick={(e) => handleNavClick(e, 'userCases')}>
          User Cases
        </a>
        <a href="#pricingAera" className="nav-link" onClick={(e) => handleNavClick(e, 'pricingAera')}>
          Pricing
        </a>
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
                  <div className="dropdown-item">
                    {isLoadingCredits ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>loading credits...</span>
                      </div>
                    ) : (
                      <span><b>{creditsRemain}</b> credits</span>
                    )}
                  </div>
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