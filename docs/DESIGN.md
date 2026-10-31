# Design System

## Direction

Sentinel is a security operations instrument, not a promotional website. Its central question is: what needs an analyst's attention now? The oldest unresolved critical finding and its affected target lead the overview. Open findings, scan runs, and targets are deliberately smaller, linked measures. A time series, severity breakdown, and recent-scan queue provide the next layer of evidence. The changes from the interface audit are recorded in [UI-AUDIT.md](UI-AUDIT.md).

The graphite sidebar establishes a stable operational boundary. A small chartreuse shield monogram and the Sentinel wordmark provide product identity without coloring every control. The working canvas is a cool near-white; blue belongs to data, and risk colors belong to risk. Borders define interactive surfaces without decorative shadows.

## Semantic Tokens

| Token                                   | Role                                          |
| --------------------------------------- | --------------------------------------------- |
| `--background`, `--foreground`          | Base content surface and reading color        |
| `--card`, `--card-foreground`           | Reserved compatible primitive surface         |
| `--popover`, `--popover-foreground`     | Dialog and filter menu content                |
| `--primary`, `--primary-foreground`     | Primary actions                               |
| `--secondary`, `--muted`                | Quiet control backgrounds and separators      |
| `--muted-foreground`                    | Supporting labels and metadata                |
| `--destructive`                         | Destructive actions and critical errors       |
| `--border`, `--input`, `--ring`         | Structure, input boundaries, focus indicators |
| `--chart-1` through `--chart-5`         | Supplied blue chart palette                   |
| `--chrome` and related extension tokens | Stable dark operational navigation            |
| `--brand`                               | Small Sentinel identity accent                |
| `--canvas`                              | Workspace ground                              |
| `--terminal`, `--terminal-text`         | Technical evidence panel                      |

The entire supplied palette is preserved. Additional semantic tokens do not replace it. Severity uses prescribed OKLCH values, registered with Tailwind 4 `@theme`. After review, severity uses a three-pixel colored rail and high-contrast text without pill fills or round corners; statuses use word labels and small rectangular marks, not circular loaders. Every severity label names its level in text and ARIA, so hue is never the only signal.

## Typography And Density

DM Sans supplies warm but precise reading shapes at compact sizes. IBM Plex Mono distinguishes IDs, hosts, CWE codes, evidence, and machine timestamps. List rows are dense. Details have generous 28-32 px insets, with separate evidence and remediation sections. Mobile retains real tables in horizontal scroll regions rather than silently discarding investigative fields.

## Reusable Patterns

- Radix Dialog supplies focus trapping, Escape, accessible titles, and modal semantics. The wrapper remembers the originating control and returns focus on close.
- The owned shadcn-style Radix Tooltip primitive supplies short labels on collapsed navigation and icon-only actions. Its trigger uses `asChild`, so links and buttons keep native semantics. Tooltip descriptions appear on hover or keyboard focus, never on top of expanded labels.
- Semantic tables use column headers, button-based sort controls, `aria-sort`, keyboard-operable rows, and noninteractive skeleton rows. Finding rows use native row semantics plus real links so selection controls are not nested inside a button role; see DEC-015.
- Filter popovers use labeled checkbox controls. AND applies between dimensions; OR applies within each dimension.
- Query errors remain inline with Retry. Mutation errors remain in the form and can also announce through the bottom-right toast.
- Empty states retain layout context and offer a relevant next action.
- Destructive target removal requires confirmation. Existing reports and historical scan evidence remain available.

## Theme

`theme.store.ts` reads the plain `theme` localStorage preference and applies the root `dark` class before app rendering. All reading surfaces and primitives consume theme tokens. Terminal evidence stays dark in both themes; the sidebar remains a stable dark frame.

## Motion

Page entry uses a 200 ms opacity/translation transition. Dialogs use 150 ms fade and scale from 0.96. Row hover is 100 ms. Charts render immediately so data never appears blank during navigation; the scan bar is the sole long transition at 700 ms. Pending buttons announce state through text and `aria-busy`, not a circular spinner. Reduced-motion media queries collapse animations and transitions. Status notifications originate from the lower-right corner.

## Skill Reconciliation

The requested taste and Hallmark skills were installed and reviewed. The application direction retained quiet achromatic chrome and a blue data series. The skill's suggested no-sidebar layout conflicts with the explicit sidebar specification, and its prohibition on colored severity marks conflicts with section 4.2; the supplied specification wins. The skill's ban on animating width also yields to section 4.3's required scan-progress transition. Details are recorded in DEC-011.
