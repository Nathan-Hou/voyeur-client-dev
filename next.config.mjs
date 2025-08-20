/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'voyeur-api.whosyourdaddy.baby',
            port: '',
            pathname: '/uploads/**',
            search: '',
          },
        ],
      }
};

export default nextConfig;
