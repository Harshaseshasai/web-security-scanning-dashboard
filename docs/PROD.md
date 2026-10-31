# Production Readiness

## SPA Hosting

The requested Vercel rewrite is included in `vercel.json`:

```json
{ "routes": [{ "src": "/(.*)", "dest": "/index.html" }] }
```

For a real deployment, place real `/api` routes and static-file handling before the SPA catch-all. The assessment host emits a single HTML artifact and serves a self-contained preview.

## Explicit Demo Boundaries

MSW is **disabled in production builds**. `main.tsx` only imports `mocks/browser.ts` inside `import.meta.env.DEV`. A static assessment preview still needs data, so `lib/api.ts` offers a separately documented in-memory demo transport that reuses the same mock service. This is not an unannounced production service-worker installation.

Configure `VITE_LIVE_API=true` to disable the static demo transport. Sign-in is required by default even in the preview. Supply authenticated `/api` endpoints with the schema contracts in `src/schemas`. Remove bundled mock code from the production artifact as part of the real deployment pipeline.

## Performance Budget

Target: less than 200 KB gzipped initial JavaScript and less than 3 seconds LCP on fast 3G. The preserved host's `vite-plugin-singlefile` configuration inlines every route and the Recharts runtime. The final measured artifact is approximately 282 KB gzipped including markup and styles, above the target. This is a known, measured gap, not a passed performance gate.

Before real production: remove single-file inlining, lazy-load operational routes and report/chart functionality, self-host subsetted WOFF2 fonts, avoid preloading inactive routes, and run Lighthouse plus real-user measurements. Fast-3G LCP is not yet certified.

## Security Work Still Required

- Real authentication using secure, HttpOnly, SameSite cookies, token expiry, refresh, server-side authorization, and tenant isolation.
- Server-side validation, target ownership verification, audit logs, permission checks, rate limiting, and scan-worker isolation.
- Encrypted credential storage in a secret manager, not browser storage or mock JSON.
- A real API, durable database, queued scan execution, cancellation, and event-driven progress.
- Durable triage history and authorization checks on status transitions.
- Server-side PDF generation, access-controlled report links, retention, and deletion policies.
- CSP, dependency audit remediation, self-hosted fonts, telemetry redaction, and a full manual accessibility audit.

The demo escapes report HTML, quotes spreadsheet data, mitigates formula injection, validates URLs, excludes unsafe URL protocols, and prevents duplicate mutations. Those local safeguards do not make client-side demo auth secure.
