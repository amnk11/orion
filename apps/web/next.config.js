/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@orion/protocols", "@orion/domain", "@orion/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
