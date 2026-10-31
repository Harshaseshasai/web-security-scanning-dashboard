# Hard Calls

## Locally Owned Radix Primitives

1. I chose the shadcn-style ownership model: small, editable Radix-based primitives rather than an admin template. I gave up the speed of importing a finished dashboard theme.
2. A company-owned, mandatory design-system package would have changed the choice.
3. Focus traps, keyboard behavior, and accessible dialog semantics should not be improvised; owning the small styled layer preserves a distinct visual language.

## Zustand And TanStack Query Together

1. I chose two focused tools and gave up the apparent simplicity of one global store.
2. A tiny interface with no remote mutations or background fetching could use just local state.
3. Query cache lifetimes and session-only triage have different semantics. Keeping them separate makes rollback and sign-out behavior explicit.

## MSW

1. I chose network-level interception and gave up the minimal setup of directly importing JSON into components.
2. An actual stable backend available during assessment would make interception unnecessary outside tests.
3. The same HTTP contracts, latency, status codes, and deliberate report error are exercised through production-shaped query code.

## URL Filter State

1. I chose shareable query parameters and gave up the convenience of keeping all filters in Zustand.
2. Highly sensitive, non-shareable filter values or a non-routed embedded widget would favor ephemeral state.
3. Security analysts need to share an exact investigation. Back, forward, reload, and copied links should all reproduce the same view.

## Typography

1. I chose DM Sans with IBM Plex Mono and gave up a zero-download system-font stack.
2. A strict offline or privacy environment would require locally hosted font files.
3. Reading prose and reading technical evidence are different tasks. The type pairing creates that distinction without extra decoration.
