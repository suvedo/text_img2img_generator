/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  devIndicators: {
    buildActivity: false
  },
  webpack: (config, { isServer }) => {
    // 自定义 webpack 配置
    return config
  },
  serverOptions: {
    // 设置较长的超时时间
    timeout: 600000, // 10分钟
    bodyParser: {
      sizeLimit: '100mb'
    }
  }
}

module.exports = nextConfig