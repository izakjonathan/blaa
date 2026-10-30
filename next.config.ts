import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  poweredByHeader: false,
  async redirects() { return [{ source: "/1671-2", destination: "/spil-hos-os", permanent: true }]; },
  outputFileTracingRoot: path.resolve(process.cwd()),
  devIndicators: false,
  allowedDevOrigins: ["terminal.local"],
  images: {
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256],
    qualities: [75],
  },
};
export default config;
