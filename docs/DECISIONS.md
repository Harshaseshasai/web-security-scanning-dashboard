# Decision Log

## DEC-001: Zustand For Client State

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Auth, theme, local triage, and UI controls are shared across distant components but have no server analogue.

### Decision

Use Zustand with selective subscriptions and separate concern-specific stores.

### Consequences (positive)

Small actions, precise subscriptions, easy state isolation in tests.

### Consequences (negative)

One additional library and explicit persistence choices.

### Alternatives rejected and why

Context couples consumer updates to provider values. Redux Toolkit adds boilerplate beyond the needs of a small session-scoped console.

## DEC-002: TanStack Query For Server State

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Lists need caching, loading states, persistent errors, background updates, and mutation rollback.

### Decision

Use TanStack Query, with retry disabled for deliberate visible errors and targeted invalidation after successful writes.

### Consequences (positive)

Consistent query lifecycles and optimistic target updates without repeated effect plumbing.

### Consequences (negative)

Query keys and invalidation boundaries require discipline.

### Alternatives rejected and why

Manual fetch effects duplicate state machines. Storing remote entities in Zustand would reinvent cache semantics.

## DEC-003: Owned Radix Primitives

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The brief explicitly permits shadcn/ui as owned Radix primitives, not an admin template.

### Decision

Use the same owned-source pattern in `components/ui`, wrapping Radix Dialog and Popover with the supplied token layer. Components are locally authored rather than depending on an opaque template.

### Consequences (positive)

Reliable focus behavior with complete styling control and no template visual baggage.

### Consequences (negative)

The local wrappers must be maintained and tested. They are shadcn-style primitives, not claimed verbatim generated files.

### Alternatives rejected and why

A full dashboard kit would obscure craft. Handwritten focus traps are easy to get wrong.

## DEC-004: MSW Instead Of Direct JSON Imports

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Realistic latency, HTTP errors, strict response validation, and idempotency need an actual request boundary.

### Decision

Use MSW in development and tests, delegating handlers to a shared service.

### Consequences (positive)

Production-shaped fetch code and reproducible deliberate failure handling.

### Consequences (negative)

Service-worker initialization and an additional mock infrastructure layer.

### Alternatives rejected and why

Direct JSON imports cannot meaningfully exercise HTTP failures and cancellation.

## DEC-005: Filters Belong In The URL

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Analysts need reproducible investigations, links, and browser history.

### Decision

Read and write filters, sort, and page through React Router search parameters. Search commits after 300 ms. A filter change resets pagination.

### Consequences (positive)

Shareable, reload-safe state with native back/forward support.

### Consequences (negative)

URL parsing and draft-search synchronization require tests.

### Alternatives rejected and why

Zustand-only filters disappear from links. Local component state cannot reproduce an investigation after reload.

## DEC-006: Recharts For A Data-Led Chart

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The overview needs an accessible, responsive time series with exact correspondence to finding data.

### Decision

Use a stroke-only Recharts line chart, CSS variable colors, no gradients, and a readable textual summary.

### Consequences (positive)

Well-supported responsive axes, tooltips, and controlled animation.

### Consequences (negative)

Meaningful bundle cost, amplified by the host's single-file configuration.

### Alternatives rejected and why

A bespoke SVG chart would be smaller but introduces maintenance and tooltip/accessibility work; the assessment explicitly requests Recharts.

## DEC-007: DM Sans And IBM Plex Mono

**Date:** 2026-10-31 | **Status:** Accepted

### Context

UI prose and technical evidence benefit from visibly different typographic roles.

### Decision

Load DM Sans for interface text and IBM Plex Mono for evidence, identifiers, hosts, and machine timestamps.

### Consequences (positive)

Clear information hierarchy without ornamental UI elements.

### Consequences (negative)

External font requests require network access; a live deployment should self-host them.

### Alternatives rejected and why

Inter, Roboto, Arial, and system-ui are expressly prohibited by the brief.

## DEC-008: Preserve OKLCH Tokens

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The supplied semantic palette is the fixed contract for light and dark rendering.

### Decision

Keep it intact; add separate semantic chrome and severity tokens rather than overwrite the palette.

### Consequences (positive)

Predictable dark/light parity and perceptually coherent risk colors.

### Consequences (negative)

Requires a current browser with OKLCH and color-mix support.

### Alternatives rejected and why

Replacing values with arbitrary hex colors would break the fixed palette. Color alone is not used as a status indicator.

## DEC-009: Vitest Instead Of Jest

**Date:** 2026-10-31 | **Status:** Accepted

### Context

This is a TypeScript Vite project with browser-oriented components and HTTP mocks.

### Decision

Use Vitest, jsdom, Testing Library, user-event, and the V8 coverage provider, with real MSW handlers.

### Consequences (positive)

Shared transform ecosystem, fast feedback, and interaction-focused tests.

### Consequences (negative)

jsdom cannot certify visual layout or full accessibility; real browser checks are also needed.

### Alternatives rejected and why

Jest adds a separate transformation configuration without a benefit for this application.

## DEC-010: Keep The Required Host Build System

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Section 3.1 requests Vite 5 and Tailwind 3, while the task host mandates the preconfigured Vite/Tailwind 4 plugin and forbids direct Vite configuration edits.

### Decision

Keep Vite 7 and Tailwind 4, install React 18, and translate severity configuration to `@theme`. Retain the single-file plugin.

### Consequences (positive)

The delivered website runs in the supplied environment without destabilizing its build pipeline.

### Consequences (negative)

Version deviation and a larger initial single-file artifact. The 200 KB target is not met by the initial build.

### Alternatives rejected and why

CRA is obsolete for this use case. Next adds a server-oriented framework to a pure SPA. Downgrading the host would conflict with higher-priority environment constraints.

## DEC-011: Resolve Skill Conflicts In Favor Of The Specification

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The requested taste and Hallmark skills were installed. Their current versions are design-review tools, not generic per-file code-quality executables.

### Decision

Apply their app-screen principles, preserve the fixed typography/palette, and use explicit specification requirements when they conflict with generated guidance.

### Consequences (positive)

Quiet chrome, honest derived totals, no gradient charts, and a concrete workflow on every screen.

### Consequences (negative)

The requested sidebar, left-border severity accents, and width-based progress animation differ from the skill defaults. Pre-commit code quality is enforced with lint, TypeScript, conventions, and tests rather than misrepresenting Hallmark as a compiler.

### Alternatives rejected and why

Blindly following the generated no-sidebar layout or deleting mandatory severity colors would violate sections 4 and 8.

## DEC-012: Explicit Static Demo Mode

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The assessment is previewed as a standalone website without a real API. A production build with both MSW disabled and no fallback cannot demonstrate the requested interactions.

### Decision

Keep service workers development-only, provide a shared in-memory production-demo transport, and require explicit demo sign-in before visiting protected routes. An environment flag enables live API behavior.

### Consequences (positive)

The deployed preview is functional, every operational route checks an explicitly established session, and login/error flows are immediately testable.

### Consequences (negative)

The static preview still bundles simulated API data, so its mock token must not be confused with production authentication.

### Alternatives rejected and why

Shipping a blank production dashboard would not satisfy a complete functional preview. Enabling MSW in production would directly contradict the service-worker requirement.

## DEC-013: One Clock Per Scan

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Section 8.3's component-local interval can diverge when a scan appears on the dashboard and scan list simultaneously.

### Decision

Use a mock-service-owned clock and conditional query polling. Progress is clamped at 100 and completion updates the same scan object returned to every observer.

### Consequences (positive)

Consistent progress across views and clean observer lifecycle management.

### Consequences (negative)

This is polling rather than a production SSE/WebSocket stream.

### Alternatives rejected and why

Independent component intervals duplicate state and can resume from inconsistent progress after navigation.

## DEC-014: Patched Validation And Tooling

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The dependency audit identified high-severity Zod 3 issues and critical development-tool advisories.

### Decision

Use Zod 4.6.7, Vitest 4.1.12, its matching coverage provider, and Vite 7.3.7. Preserve the section 6 schema contracts using non-deprecated Zod APIs.

### Consequences (positive)

No high or critical dependency advisories remain at verification. All existing contract and interaction tests still run.

### Consequences (negative)

The brief's example syntax is updated where deprecated. React Router v6 is retained as explicitly required; its remaining moderate advisories still need production review.

### Alternatives rejected and why

Suppressing dependency warnings without remediation is inappropriate for a security-tool assessment.

## DEC-015: Native Rows With Independent Selection

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Section 9 prescribes a button role on table rows. Combining that role with row-selection checkboxes creates a serious nested-interactive accessibility violation.

### Decision

Finding rows retain native row semantics, a real title link, and Enter/Space row navigation. Selection checkboxes remain separately labeled and focusable. Scan rows without embedded controls retain the prescribed button role.

### Consequences (positive)

Selection and navigation are independently accessible and pass the automated WCAG audit.

### Consequences (negative)

The exact finding-row role differs from the example implementation; the intended keyboard behavior is preserved and tested.

### Alternatives rejected and why

Hiding selection from keyboard users would fail WCAG. Removing all selection would lose useful bulk triage and export workflows.

## DEC-016: Critical Risk Leads The Dashboard

**Date:** 2026-10-31 | **Status:** Accepted

### Context

Four equal KPI tiles, and then four equal divided measures, did not answer the analyst's first question: what must be investigated next? The review also rejected rounded severity/status pills and circular loading icons.

### Decision

Put unresolved critical findings first, make the oldest one directly actionable, and subordinate open findings, scan runs, and targets. Show severity as a narrow colored rail plus readable text; show status as text plus a rectangular mark. Keep loading as skeleton rows and textual pending actions. Charts render immediately rather than leaving a temporary blank canvas.

### Consequences (positive)

Priority now follows investigation urgency rather than object count; the first viewport points to a specific finding. Color is reserved for risk and state, not ornamental badges.

### Consequences (negative)

The severity presentation intentionally replaces the earlier section 4.3 pill recipe after direct review feedback. Status is less decorative, so labels must remain readable and visible.

### Alternatives rejected and why

Reordering equal-sized tiles would not create hierarchy. More saturated pills or spinning glyphs would repeat the problem instead of explaining the data.

## DEC-017: Match The Assignment Contract In The Core Screens

**Date:** 2026-10-31 | **Status:** Accepted

### Context

The clarified brief calls for a separate sortable CWE column, OWASP Top 10 labels, a scan-runs KPI, settings with an API-key placeholder, and a PDF action that may be stubbed.

### Decision

Expose CWE separately, supply official OWASP labels with weakness-specific evidence, count all scan runs, add a disabled/labeled API-key field, and mark PDF export explicitly as a demo placeholder while keeping real HTML/JSON/CSV downloads.

### Consequences (positive)

The centrepiece table is easier to scan, sorting is complete, and the remaining mock-only capabilities are honest about their limits.

### Consequences (negative)

The longer OWASP category names increase table width; the existing horizontal table region retains all columns at narrow sizes.

### Alternatives rejected and why

Hiding CWE under the title or presenting HTML as a PDF would misrepresent the specified workflow. Accepting an API key without a backend would imply that it is stored securely when it is not.
