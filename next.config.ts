import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "forjapro-erp-ygorlimafire-8859s-projects.vercel.app"],
    },
  },
}

export default nextConfig
