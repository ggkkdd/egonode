/** @type {import('next').NextConfig} */

// Content-Security-Policy. Kept compatible with the app's needs:
//  - script/style 'unsafe-inline' (Next's inline bootstrap + Tailwind/styled-jsx)
//    and 'unsafe-eval' (Next dev HMR).
//  - img https: + data:/blob: (AI-generated verdict images come from external
//    hosts like fal.media; their exact URL isn't known ahead of time).
//  - connect https: + wss: (Supabase REST + realtime, same-origin API routes).
//  - media 'self' (all audio is served from /public).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https: wss:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // drop the "X-Powered-By: Next.js" fingerprint
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

module.exports = nextConfig;
