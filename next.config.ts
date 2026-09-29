import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages folded into the homepage flow keep working as links.
  async redirects() {
    return [
      { source: "/get-started", destination: "/#starter", permanent: false },
      { source: "/simulator", destination: "/#your-path", permanent: false },
      { source: "/careers", destination: "/majors", permanent: false },
      { source: "/sign-in", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
