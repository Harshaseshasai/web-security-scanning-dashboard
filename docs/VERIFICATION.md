# Verification

## Automated Tests

The verified Vitest run passes **210 tests** across 10 files. V8 coverage reports:

| Metric     | Measured | Required |
| ---------- | -------- | -------- |
| Statements | 97.75%   | 90%      |
| Branches   | 93.88%   | 90%      |
| Functions  | 97.42%   | 90%      |
| Lines      | 98.57%   | 90%      |

Coverage includes application components, pages, hooks, validation, filtering, routing, stores, and API code. Owned UI wrappers and mock infrastructure are excluded following the specification; test files and generated declarations are also excluded. The threshold is enforced, not lowered for this result.

## Browser Workflow Checks

`node scripts/browser-smoke.mjs` runs against `http://localhost:5173`, or `SMOKE_URL` when provided. The full workflow has passed against both the development-MSW application and the built production preview in Chromium:

- Search reduces findings and persists the URL.
- Finding detail opens and accepts a valid status transition.
- Target creation succeeds and its target can be scanned.
- An open modal traps focus and Escape returns focus to its triggering control.
- Report generation returns the deliberate first 503, succeeds on explicit retry, and downloads an actual HTML file.
- Dark and light themes switch correctly.
- A fresh visit to a protected URL redirects to login. Sign-out returns there, incorrect credentials produce an inline error, and the documented demo account signs in.
- Mobile navigation works and the page does not acquire horizontal document overflow.
- No uncaught browser page errors occur during these workflows.

Screenshots are captured from the running application, not generated mockups. The final production browser audit reports **zero WCAG 2.1 A/AA rule violations across all seven screens**, including login, and writes `docs/accessibility-audit.json`. The browser suite also checks the critical-first KPI hierarchy, noncircular severity/status treatment, modal focus, back/forward filter restoration, and mobile document overflow. Automated accessibility checks do not replace a full screen-reader and keyboard usability audit.

## Quality Gates

All final commands pass: `check:conventions`, `lint`, `format:check`, `typecheck`, `coverage`, `build`, and the production `test:browser` run. Formatting uses Prettier with `prettier-plugin-tailwindcss`. The final build emits a 281.71 KB gzipped single-file artifact. Rollup emits two non-blocking annotation warnings from the patched Zod dependency; application lint has zero warnings.

## Explicit Limitations

The production single-file artifact is above the 200 KB gzip performance target. Fast-3G LCP is unverified. Real authentication, real scan execution, durable API storage, and server-side PDF generation are intentionally outside this mock assessment. Production dependency advisories must be reviewed before adopting this project in a real environment.
