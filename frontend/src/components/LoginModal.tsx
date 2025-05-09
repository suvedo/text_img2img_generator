import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

import { API_BASE_URL } from '../config'
import { NotifyToast } from './NotifyToast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isSignUp, setIsSignUp] = useState(false)

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('warning');
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSendVerifyCode = async () => {
    if (!email) {
      showNotification('please input email', 'warning')
      return
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/gen_img/send_signup_verify_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: email
        })
      })
  
      if (response.ok) {
        // 开始倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // const data = await response.json()
        showNotification(`send verify code error`, 'error')
      }
    } catch (error) {
      // console.error('send verify code error: ', error)
      showNotification('send verify code failed, please try it later', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp && password !== confirmPassword) {
      showNotification('Passwords do not match', 'warning')
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
            verify_code: verifyCode,
          }),
        })
  
        const data = await res.json()
  
        if (data.ok) {
          showNotification('signup ok, signin please', 'success')
          setIsSignUp(false)
          setPassword('')
        } else {
          if (data.msg === 'verify code is invalid') {
            showNotification(`verify code is invalid or expired`, 'warning')
          } else {
            showNotification(`An error occurred during signup: ${data.msg}`, 'error')
          }
        }
      } catch (error) {
        // console.log('signup error:', error)
        showNotification(`An error occurred during signup:${error}`, 'error')
      }
      
    } else {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        
        if (result?.error) {
          showNotification(result.error, 'error')
        } else {
          onClose()
        }
      } catch (error) {
        // console.error('Login error:', error)
        showNotification('An error occurred during login', 'error')
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
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
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}
                {isSignUp && (
                  <div className="mb-3">
                  <label htmlFor="verifyCode" className="form-label">Verify Code</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      id="verifyCode"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="Enter verification code"
                      required
                      style={{ borderRadius: '4px 0 0 4px' }}
                    />
                    <button 
                      className={`btn ${countdown > 0 ? 'btn-secondary' : 'btn-outline-primary'}`}
                      type="button"
                      onClick={handleSendVerifyCode}
                      disabled={countdown > 0}
                      style={{
                        marginLeft: '8px',
                        minWidth: '120px',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {countdown > 0 ? `${countdown}s` : 'Send Code'}
                    </button>
                  </div>
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

      <NotifyToast 
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </>
  )

  // 使用 Portal 将模态框渲染到 body
  return createPortal(modalContent, document.body)
}