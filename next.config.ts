import type { NextConfig } from "next";

/**
 * Routing for the root locale.
 *
 * English lives at `/`, but every page is rendered by the `[lang]` route, so
 * `/` is an internal rewrite to `/en` and `/en` permanently redirects back to
 * the canonical root. The same mapping keeps English project pages at clean
 * `/projects/:slug` URLs. These rules live in `next.config.ts` rather than a
 * `proxy.ts` middleware because middleware rewrites must be absolute URLs;
 * Next normalizes loopback hosts to `localhost` while the router compares the
 * rewrite origin against the hostname passed to `next start -H`. When those
 * differ (e.g. `-H 127.0.0.1`) the internal rewrite is treated as external
 * and becomes a 308 back to `/` — an infinite loop. Config rewrites are
 * path-based, so they stay internal on every host and binding.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The root layout lives under the [lang] dynamic segment, so the
  // documented global-not-found file convention is enabled to serve
  // unmatched URLs (see src/app/global-not-found.tsx).
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      {
        source: "/en/projects/:slug",
        destination: "/projects/:slug",
        permanent: true,
      },
      {
        source: "/en/about",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/projects/:slug",
          destination: "/en/projects/:slug",
        },
        {
          source: "/about",
          destination: "/en/about",
        },
        {
          source: "/",
          destination: "/en",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
