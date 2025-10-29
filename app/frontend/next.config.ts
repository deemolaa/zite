import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {

  // Don't fail production build on ESLint warnings
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: path.join(__dirname, "../.."),

  async headers() {
    // Required by FHEVM 
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],

      },
    ];
  }
};

export default nextConfig;
