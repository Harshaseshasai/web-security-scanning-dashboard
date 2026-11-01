# Sentinel Security Workspace

Sentinel is a React 18 and TypeScript security assessment console for analysts. Add authorized targets, follow simulated scans, investigate evidence, triage findings, and download reports. The interface pairs a quiet operational dashboard with dense, URL-driven findings tables and dark terminal evidence. This is a self-contained assessment demo: it does not scan real websites or transmit target credentials to a real service.

![The running Sentinel dashboard](docs/screenshots/dashboard.png)

## Stack And Ownership

React 18, TypeScript, Vite, Tailwind, React Router v6, locally owned Radix primitives, Zustand, TanStack Query, Zod, MSW, Recharts, and Vitest. DM Sans is the UI face; IBM Plex Mono is reserved for technical identifiers and evidence. The provided Vite 7 and Tailwind 4 host configuration is retained instead of downgrading it; see DEC-010.

**Zustand** handles all client state with no server analogue:

- Auth token and session
- Active theme (light/dark) with localStorage persistence
- Finding status mutations (open to confirmed to resolved / false_positive), local-session-only per brief
- UI state: sidebar collapsed, active modal, selected rows

**Why not Context?** Auth and theme must be read in deeply nested components. Context causes every Consumer to re-render on any change. Zustand with `subscribeWithSelector` enables surgical re-renders: only the component that reads the specific slice re-renders.

**Why not Redux Toolkit?** Correct architecture, 3x the boilerplate for a session-scoped mock.

**TanStack Query** handles all server state (mock API responses):

- Targets, Scans, Findings, Reports lists
- Individual finding by ID
- Mutations: add/edit/delete target, create scan, generate report

**Why TanStack Query?** Built-in `isLoading`, `isError`, `data` states eliminate boilerplate and directly satisfy the brief's requirement for loading and error states on every data view. `useMutation` with `onMutate` enables optimistic updates: add/edit/delete feels instant while the mock API resolves. Without it, you write `useState` + `useEffect` + `try/catch` for every single endpoint: that's five extra files for six endpoints.

**Why both?** They solve different problems. TanStack Query caches server responses. Zustand manages what only the client knows. Merging them into one creates coupling between concerns that should be independent.

## Setup And Run

```sh
pnpm install
pnpm dev
```

Node 20.19+ is required by the preconfigured Vite host. npm is equally supported (`npm install`, `npm run dev`), and an npm lockfile is included. No API keys are needed. The MSW worker is checked into `public/`; regenerate it with `npx msw init public` if necessary.

```sh
pnpm build
pnpm preview
```

## Tests And Quality

```sh
pnpm test
pnpm coverage
pnpm check:conventions
pnpm lint
pnpm format:check
pnpm typecheck
```

Vitest tests exercise schema boundaries, combined filter logic, sorting, pagination, keyboard navigation, auth guards, data states, optimistic rollback, idempotency, triage transitions, and report retry. The coverage command retains the requested 90% threshold for statements, branches, functions, and lines; it deliberately fails if any metric is below that threshold. See `docs/VERIFICATION.md` for measured results, not an implied coverage claim.

The pre-commit hook runs all five local gates. Enable it in a Git checkout with `git config core.hooksPath .husky`. GitHub Actions additionally runs coverage and the production build. No synthetic commit history has been created.

## Demo Credentials

```text
Email: demo@example.com
Password: password123
Token: mock-jwt-token-demo
```

The app opens at login. Use the demo account or the "Enter demo workspace" button to authenticate; direct visits to protected routes redirect to `/login`. An authenticated visit to `/login` redirects to the dashboard. Authentication remains a fake session token, not a real security boundary.

## Known Gaps And Assumptions

- Vite 7 and Tailwind 4 are host requirements. All supplied OKLCH tokens are preserved; severity extensions use Tailwind 4's `@theme` rather than a v3 configuration file.
- MSW is imported only in development. Static preview builds use the same in-memory service through a documented demo transport, but still require explicit sign-in. Set `VITE_LIVE_API=true` when supplying a real backend.
- The first report-generation request intentionally returns 503. The persistent inline error and enabled retry control are expected behavior, not a broken feature.
- The "Download PDF" action is an explicit demo placeholder with an explanatory toast; HTML can be printed to PDF using the browser. Server-side PDF generation is not implemented. Findings can be exported as CSV.
- Dataset dates are anchored to October 31, 2026, for reproducible demos. Dashboard totals, severity counts, and historical chart series are computed from the same 48 findings, not unrelated marketing metrics.
- Target credentials are validated, consumed, and discarded. Finding status overrides reset on reload or sign-out. Mock entity changes reset when the page is reloaded.
- The preserved single-file Vite configuration prevents effective route code-splitting. The current artifact exceeds the requested 200 KB gzip initial budget; LCP under fast 3G is not certified. See `docs/PROD.md`.
- Client-side guards and mock tokens are not production authentication. Do not deploy this demo as a real scanner or use real credentials.

See [Architecture](docs/ARCHITECTURE.md) ([detailed pages](docs/architecture/README.md)), [Design](docs/DESIGN.md), [Interface audit](docs/UI-AUDIT.md), [Decisions](docs/DECISIONS.md), [Trade-offs](docs/DOUBLE-DOWN.md), and [Production](docs/PROD.md).
