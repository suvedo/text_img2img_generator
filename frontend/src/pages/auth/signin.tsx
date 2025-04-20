import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function SignIn() {
  const router = useRouter()
  const { callbackUrl } = router.query

  return (
    <>
      <Head>
        <title>Log in - Image Factory</title>
      </Head>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h2 className="text-center mb-4">Log in</h2>
                <div className="d-grid gap-3">
                  <button
                    className="btn btn-dark btn-lg"
                    onClick={() => signIn('github', { 
                      callbackUrl: callbackUrl as string || '/' 
                    })}
                  >
                    <i className="fab fa-github me-2"></i>
                    使用 GitHub 登录
                  </button>
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={() => signIn('google', { 
                      callbackUrl: callbackUrl as string || '/' 
                    })}
                  >
                    <i className="fab fa-google me-2"></i>
                    使用 Google 登录
                  </button>
                </div>

                <div className="text-center mt-4 text-muted">
                  <small>
                    登录即表示您同意我们的服务条款和隐私政策
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}