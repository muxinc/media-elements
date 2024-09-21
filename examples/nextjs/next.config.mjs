/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/hls-video': ['./app/theme-toggle.js'],
    }
  }
};

export default nextConfig;
