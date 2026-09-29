import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ThreeUI's Sylva scene runs in a sandboxed (opaque-origin) iframe and loads its
  // authored font from /inner-green-assets/, so that folder must allow cross-origin reads.
  async headers() {
    return [{ source: "/inner-green-assets/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
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
