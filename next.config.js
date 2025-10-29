/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { unoptimized: true },
  // No pongas experimental.serverActions ni generateStaticParams/dynamicParams acá
};

module.exports = nextConfig;