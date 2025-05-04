import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect } from 'react'

export default function Error() {
  const router = useRouter()
  const { error } = router.query

  useEffect(() => {
    document.body.style.background = 'linear-gradient(120deg, #F8F9FA 0%, #E9ECEF 100%)'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  const getErrorMessage = () => {
    switch (error) {
      case 'AccessDenied':
        return 'Access Denied'
      case 'Configuration':
        return 'Server Configuration Error'
      default:
        return 'An Unknown Error Occurred'
    }
  }

  const getErrorDescription = () => {
    switch (error) {
      case 'AccessDenied':
        return 'You do not have permission to access this resource.'
      case 'Configuration':
        return 'There was an issue with the server configuration. Please try again later.'
      default:
        return 'Something went wrong. Please try again or contact support.'
    }
  }

  return (
    <>
      <Head>
        <title>Login Error - Image Factory</title>
      </Head>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg animate__animated animate__fadeInUp" 
                 style={{
                   background: 'rgba(255, 255, 255, 0.85)',
                   backdropFilter: 'blur(10px)',
                   border: 'none',
                   borderRadius: '15px',
                   boxShadow: '0 8px 32px rgba(100, 223, 223, 0.15)'
                 }}>
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <i className="fas fa-exclamation-circle text-danger" style={{ fontSize: '4rem' }}></i>
                </div>
                <h2 className="text-danger mb-3" style={{ 
                  background: 'linear-gradient(120deg, #FF9A8B 0%, #FF6B6B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold'
                }}>
                  {getErrorMessage()}
                </h2>
                <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                  {getErrorDescription()}
                </p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => router.push('/')}
                  style={{
                    background: 'linear-gradient(120deg, #64DFDF 0%, #80FFDB 100%)',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '12px 30px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}