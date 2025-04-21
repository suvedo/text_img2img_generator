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
        destination: 'http://127.0.0.1:8000/gen_img/:path*'  // 使用 127.0.0.1 而不是 localhost
      }
    ]
  }
}

module.exports = nextConfig