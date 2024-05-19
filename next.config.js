/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/src/api/:path*",
        headers: [
          // { key: "Access-Control-Allow-Credentials", value: "true" },
          // {
          //   key: "Access-Control-Allow-Origin",
          //   value: "https://warpcast.com",
          // }, // replace this your actual origin
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
