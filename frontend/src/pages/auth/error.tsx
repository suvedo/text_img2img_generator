import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Error() {
  const router = useRouter()
  const { error } = router.query

  return (
    <>
      <Head>
        <title>登录错误 - Image Factory</title>
        <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.1.3/css/bootstrap.min.css" rel="stylesheet" />
      </Head>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body p-5 text-center">
                <h2 className="text-danger mb-4">登录失败</h2>
                <p className="text-muted">
                  {error === 'AccessDenied' && '访问被拒绝'}
                  {error === 'Configuration' && '服务器配置错误'}
                  {!error && '发生未知错误'}
                </p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => router.push('/')}
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}