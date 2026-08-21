/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

