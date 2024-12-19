/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/hls-video': ['./app/theme-toggle.js'],
  }
};

export default nextConfig;
