import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Static export into dist/. Every link points at an exact `index.html`
 * file so it works on hosts that only serve exact files. The dev server
 * has no such files, so in development `/` and `…/index.html` are
 * rewritten to the matching route (rewrites are dev-only because static
 * export does not support them).
 */
const base: NextConfig = {
  poweredByHeader: false,
  distDir: "dist",
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    globalNotFound: true,
  },
};

export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return base;
  // Export mode validates rewritten params, so dev runs as a normal server.
  const { output: _output, ...dev } = base;
  return {
    ...dev,
    async rewrites() {
      return [
        { source: "/", destination: "/ar/" },
        { source: "/index.html", destination: "/ar/" },
        { source: "/:path*/index.html", destination: "/:path*/" },
      ];
    },
  };
}
