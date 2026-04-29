import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/english",
  assetPrefix: "/english/",
  trailingSlash: true,
};

export default nextConfig;
