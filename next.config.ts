import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "forjapro-erp.vercel.app"],
    },
  },
  // Next.js vendors @opentelemetry/api compiled via ncc, which emits:
  //   if(typeof __nccwpck_require__!=="undefined") __nccwpck_require__.ab=__dirname+"/";
  // Vercel Edge Runtime defines __nccwpck_require__ but NOT __dirname → crash.
  // Turbopack (local) dead-code-eliminates this line; webpack (Vercel) does not.
  // DefinePlugin stubs __dirname so the expression evaluates safely.
  webpack(config, { nextRuntime }) {
    if (nextRuntime === "edge") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DefinePlugin } = require("webpack")
      config.plugins ??= []
      config.plugins.push(new DefinePlugin({ __dirname: JSON.stringify("/") }))
    }
    return config
  },
}

export default nextConfig
