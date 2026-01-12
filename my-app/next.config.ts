import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: '/workflows',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
