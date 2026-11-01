import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useFindingStore } from '@/store/findings-filter.store'
import { useUiStore } from '@/store/ui.store'
import { SessionSchema } from '@/schemas/auth.schema'
import { DEMO_USER_ID, DEMO_WORKSPACE_ID } from '@/mocks/identity'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { targets } from '@/mocks/data/targets'
import { scans } from '@/mocks/data/scans'
import { findings } from '@/mocks/data/findings'
import { reports } from '@/mocks/data/reports'

/** Seeds each test with independent, schema-validated mock entity copies. */
export function seededClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  client.setQueryData(['targets'], structuredClone(targets))
  client.setQueryData(['scans'], structuredClone(scans))
  client.setQueryData(['findings'], structuredClone(findings))
  client.setQueryData(['reports'], structuredClone(reports))
  findings.forEach((finding) =>
    client.setQueryData(['finding', finding.id], structuredClone(finding))
  )
  return client
}

/** Resets authentication, triage, and transient UI state between tests. */
export function resetStores() {
  useAuthStore.getState().signIn(
    SessionSchema.parse({
      token: 'mock-jwt-token-demo',
      user: {
        id: DEMO_USER_ID,
        name: 'Alex Morgan',
        email: 'demo@example.com',
        role: 'Security analyst',
      },
      workspaceId: DEMO_WORKSPACE_ID,
    })
  )
  useFindingStore.getState().reset()
  useUiStore.setState({
    modal: null,
    editTargetId: null,
    selectedRows: [],
    collapsed: false,
    mobileOpen: false,
    preselectedTarget: '',
  })
}
/** Exposes router history changes to interaction assertions. */
export function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}
/** Wraps test views with query, routing, and shared tooltip providers. */
export function renderView(
  ui: ReactNode,
  {
    route = '/',
    path = '*',
    client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: Infinity },
        mutations: { retry: false },
      },
    }),
  } = {}
) {
  const result = render(
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={0}>
        <MemoryRouter
          initialEntries={[route]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
  return { ...result, client }
}
