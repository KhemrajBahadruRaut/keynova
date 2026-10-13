import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_BASE;
const apiUrl = apiBase ? new URL(apiBase) : null;

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/photo-*",
      },
      ...(apiUrl ? [{
          protocol: apiUrl.protocol === "https:" ? ("https" as const) : ("http" as const),
          hostname: apiUrl.hostname,
          port: apiUrl.port,
          pathname: `${apiUrl.pathname.replace(/\/$/, "")}/uploads/**`,
          search: "",
        }] : []),
    ],
    // Only needed when the local PHP upload server is on localhost.
    dangerouslyAllowLocalIP: apiUrl
      ? ["localhost", "127.0.0.1"].includes(apiUrl.hostname)
      : false,
    maximumRedirects: 0,
  },
  async redirects() {
    return [
      {
        source: "/meet-the-team/:slug",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
