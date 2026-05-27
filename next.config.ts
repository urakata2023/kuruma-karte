import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // iPhone の HEIC 写真 (3〜5MB) をServer Actionで受け取れるよう拡張
      // デフォルト 1MB → 20MB
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
