/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  devIndicators: {
    buildActivity: false
  },
  async rewrites() {
    return [
      {
        source: '/gen_img/:path*',
        destination: 'http://127.0.0.1:8000/gen_img/:path*',
        // 添加代理配置
        has: [{
          type: 'header',
          key: 'Accept'
        }]
      }
    ]
  },
  // 添加服务器配置
  serverOptions: {
    // 设置较长的超时时间
    timeout: 600000, // 10分钟
    bodyParser: {
      sizeLimit: '100mb'
    }
  }
}

module.exports = nextConfig