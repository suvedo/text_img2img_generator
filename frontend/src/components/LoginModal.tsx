import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

import { API_BASE_URL } from '../config'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp && password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (isSignUp) {
      try {
        const res = await fetch(`${API_BASE_URL}/gen_img/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        })
  
        const data = await res.json()
  
        if (data.ok) {
          alert('signup ok, signin please')
          setIsSignUp(false)
          setPassword('')
        } else {
          alert(`An error occurred during signup:${data.msg}`)
        }
      } catch (error) {
        console.log('signup error:', error)
        alert(`An error occurred during signup:${error}`)
      }
      
    } else {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        
        if (result?.error) {
          alert(result.error)
        } else {
          onClose()
        }
      } catch (error) {
        console.error('Login error:', error)
        alert('An error occurred during login')
      }
    }
  }

  // 切换登录/注册模式时重置密码字段
  const handleModeToggle = () => {
    setIsSignUp(!isSignUp)
    setPassword('')
    setConfirmPassword('')
  }

  if (!isOpen) return null

  const modalContent = (
    <>
      <div className="modal-backdrop fade show"></div>
      <div 
        className="modal fade show" 
        style={{
          display: 'block',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1055,
          overflow: 'hidden',
          outline: 0
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div 
          className="modal-dialog modal-dialog-centered"
          style={{
            transform: 'translate(0, 0)',
            maxWidth: '500px',
            margin: '1.75rem auto'
          }}
        >
          <div className="modal-content">
            <div className="modal-header justify-content-center">
              <h5 className="modal-title">{isSignUp ? 'Sign up' : 'Log in'}</h5>
              <button 
                type="button" 
                className="btn-close position-absolute end-0 me-3" 
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <form id="loginForm" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="loginEmail" className="form-label">Email address</label>
                  <input
                    type="email"
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please enter a valid email address')}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    className="form-control"
                    id="loginEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="loginPassword" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="loginPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {isSignUp && (
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-100 mb-2">
                  {isSignUp ? 'Sign up' : 'Log in'}
                </button>
              </form>

              <div className="text-center mb-3">
                <p className="mb-0">
                  {isSignUp ? 'Already have an account?' : 'No account?'}
                  <button 
                    className="btn btn-link" 
                    onClick={handleModeToggle}
                  >
                    {isSignUp ? 'Click to log in' : 'Click to sign up'}
                  </button>
                </p>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-dark"
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      const result = await signIn('github', { 
                        callbackUrl: window.location.href, //window.location.origin,
                        redirect: true, //false
                      })
                      if (!result?.error) {
                        onClose()
                      }
                    } catch (error) {
                      console.error('GitHub login error:', error)
                    }
                  }}
                >
                  <i className="fab fa-github me-2"></i>
                  Continue with GitHub
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      const result = await signIn('google', { 
                        callbackUrl: window.location.href, //window.location.origin,
                        redirect: true, //false
                      })
                      if (!result?.error) {
                        onClose()
                      }
                    } catch (error) {
                      console.error('Google login error:', error)
                    }
                  }}
                >
                  <i className="fab fa-google me-2"></i>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // 使用 Portal 将模态框渲染到 body
  return createPortal(modalContent, document.body)
}