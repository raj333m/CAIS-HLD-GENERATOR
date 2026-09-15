/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages: ['docx', 'bcryptjs', 'jsonwebtoken', '@prisma/client', 'prisma', '@resvg/resvg-js']
};

export default nextConfig;
