// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ⚠️ MUY IMPORTANTE: necesitamos un server en Vercel (no "export" estático)
  output: "standalone",
  experimental: {
    // opcional, pero útil si usás Server Actions
    serverActions: { bodySizeLimit: "2mb" },
  },
  // evita que la build falle por warnings de Tipos/ESLint en producción
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;

