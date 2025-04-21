/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    devIndicators: {
        buildActivity: false
    },
    // async rewrites() {
    //     return [
    //       {
    //         source: '/api/:path*',
    //         destination: 'http://localhost:8000/api/:path*', // 代理到后端
    //       },
    //     ];
    //   }
} 
  
module.exports = nextConfig