import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  skipTrailingSlashRedirect: true, // Prevents 308 redirects that break GitHub webhook signatures
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
