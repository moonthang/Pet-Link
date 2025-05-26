
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co', 
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io', 
      }
    ],
  },
};

export default nextConfig;
