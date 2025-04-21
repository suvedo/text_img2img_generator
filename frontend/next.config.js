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
        destination: 'http://localhost:8000/gen_img/:path*'
      }
    ]
  }
}

module.exports = nextConfig