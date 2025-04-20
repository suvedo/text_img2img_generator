import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar navbar-expand-lg navbar-light ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <Link href="/" className="navbar-brand">Home</Link>
          <Link href="#userCases" className="nav-link">User Cases</Link>
          <button className="nav-link" id="pricingButton">Pricing</button>
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
                  <button className="dropdown-item" onClick={() => signOut()}>Log out</button>
                </li>
              </ul>
          </div>
          ) : (
            <>
              <button className="nav-link mx-2" onClick={() => signIn()}>
                Log in
              </button>
              <button className="nav-link" onClick={() => signIn()}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}