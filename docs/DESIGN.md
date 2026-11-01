# Design

## Intent

The interface is an operational security console, not a marketing dashboard. It prioritizes the investigation queue, then supporting scan/target totals, followed by evidence-heavy tables and technical detail.

## Visual System

- Typography: DM Sans for interface copy; IBM Plex Mono for IDs, paths, timestamps, and HTTP evidence.
- Surfaces and text use shared light/dark CSS variables (`--background`, `--foreground`, `--secondary`, and `--muted-foreground`). Severity colors are paired with visible labels and counts rather than used alone.
- The dashboard uses a critical-priority lead with supporting metrics, a line chart for findings over time, a labeled severity breakdown, and a recent-scan table.
- Tables keep data dense and scannable; technical evidence uses a terminal-style monospace panel.
- Responsive rules collapse dashboard columns and expose a compact navigation drawer on narrow screens.

Tailwind CSS 4 is configured, but most page and component layout is authored in `src/index.css`. This is a documented deviation from the assignment's utility-first styling preference.

## Loading And Motion

Each dashboard data region has a shape-matched skeleton: KPI summary, line chart/severity chart, recent-scans table, or activity list. Skeletons are theme-token based, exposed as busy status regions, and hidden from assistive technology. Loaded sections reveal after their corresponding skeleton is removed. Scroll reveals use opacity/transform only; `prefers-reduced-motion` disables reveal and skeleton animation.

## Navigation And Keyboard

- Sidebar navigation uses links; `Tab`/`Shift+Tab` move through controls and `Enter` activates links.
- `Enter` activates buttons; `Space` activates buttons and toggles native checkboxes.
- The custom select opens with `Enter`, `Space`, or an arrow key. `ArrowUp`/`ArrowDown` moves through enabled options, `Home`/`End` goes to the first/last option, `Enter`/`Space` selects, and `Escape` closes.
- Scan rows support `Enter` and `Space`. Filter popovers use native checkboxes.
- Dialogs trap focus while open, close with `Escape`, and restore focus to their trigger.
- Findings search/filter/sort/page state is represented in the URL so browser back/forward navigation restores the view.

The browser workflow checks the accessible tree with axe and stores its result in `docs/accessibility-audit.json`.
