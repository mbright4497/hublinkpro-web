import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL: these redirects protect the live Meta ad. The HLP Asphalt funnel
  // lives on go.hublinkpro.com — the apex must forward /asphalt to it. Never remove.
  async redirects() {
    return [
      { source: "/asphalt", destination: "https://go.hublinkpro.com/asphalt", permanent: false },
      { source: "/asphalt-page", destination: "https://go.hublinkpro.com/asphalt", permanent: false },
    ];
  },
};

export default nextConfig;
