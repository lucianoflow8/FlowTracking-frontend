/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  experimental: {
    serverActions: {}, // ✅ debe ser objeto, no boolean
  },

  // ✅ Forzamos que TODAS las páginas se sirvan dinámicamente
  generateStaticParams: async () => [],
  dynamicParams: true,

  // ✅ Desactiva static export para evitar prerender
  images: { unoptimized: true },
};

module.exports = nextConfig;