/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['sqlite3'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
