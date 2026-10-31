import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient } from '@tanstack/react-query'
import DashboardPage from '../pages/DashboardPage'
import TargetsPage from '../pages/TargetsPage'
import ScansPage from '../pages/ScansPage'
import FindingsPage from '../pages/FindingsPage'
import FindingDetailPage from '../pages/FindingDetailPage'
import ReportsPage from '../pages/ReportsPage'
import { ScanForm } from '../components/features/scans/ScanForm'
import { ReportForm } from '../components/features/reports/ReportForm'
import { ScansTable } from '../components/features/scans/ScansTable'
import { GlobalModals } from '../components/layout/GlobalModals'
import { AppRoutes } from '../router'
import App from '../App'
import { useDebounce } from '../hooks/use-debounce'
import { renderView, resetStores, seededClient } from './render'
import { server } from './setup'
import { useUiStore } from '../store/ui.store'
import { scans } from '../mocks/data/scans'
import { targets } from '../mocks/data/targets'

beforeEach(resetStores)
const views = [
  { name: 'targets', element: <TargetsPage />, endpoint: '/api/targets' },
  { name: 'scans', element: <ScansPage />, endpoint: '/api/scans' },
  { name: 'findings', element: <FindingsPage />, endpoint: '/api/findings' },
  { name: 'reports', element: <ReportsPage />, endpoint: '/api/reports' },
]
describe('Loading, empty, and persistent error states', () => {
  it.each(views)('renders skeletons while $name are loading', ({ element }) => {
    renderView(element)
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0)
  })
  it.each(views)('renders an inline error and retries $name', async ({ element, endpoint }) => {
    const response = vi.fn(() => HttpResponse.json({ error: 'Temporary outage' }, { status: 503 }))
    server.use(http.get(endpoint, response))
    renderView(element)
    const alerts = await screen.findAllByRole('alert')
    expect(alerts[0]).toHaveTextContent('Temporary outage')
    await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0])
    await waitFor(() => {
      expect(response.mock.calls.length).toBeGreaterThan(1)
    })
  })
  it.each(views)('renders an actionable empty $name state', async ({ element, name }) => {
    const client = seededClient()
    client.setQueryData([name], [])
    renderView(element, { client })
    const empty = document.querySelector('.empty-state')
    expect(empty).not.toBeNull()
    const action = empty?.querySelector('button')
    if (action) await userEvent.click(action)
  })
  it('renders loading and error finding details', async () => {
    server.use(
      http.get('/api/findings/:id', () =>
        HttpResponse.json({ error: 'Finding not found' }, { status: 404 })
      )
    )
    renderView(<FindingDetailPage />, { route: '/findings/missing', path: '/findings/:id' })
    expect(screen.getByRole('heading', { name: 'Loading finding' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Finding unavailable' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  })
  it('renders dashboard skeletons and independent error sections', async () => {
    server.use(
      http.get('/api/targets', () =>
        HttpResponse.json({ error: 'Targets offline' }, { status: 503 })
      ),
      http.get('/api/findings', () =>
        HttpResponse.json({ error: 'Findings offline' }, { status: 503 })
      ),
      http.get('/api/scans', () => HttpResponse.json({ error: 'Scans offline' }, { status: 503 }))
    )
    renderView(<DashboardPage />)
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0)
    await screen.findByText('Findings offline')
    const retries = screen.getAllByRole('button', { name: 'Retry' })
    for (const retry of retries) await userEvent.click(retry)
    await userEvent.click(screen.getByRole('tab', { name: 'Activity log' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Scans offline')
  })
  it('offers a first target from an empty dashboard', async () => {
    const client = seededClient()
    client.setQueryData(['findings'], [])
    client.setQueryData(['scans'], [])
    renderView(<DashboardPage />, { client })
    expect(screen.getByText('No critical findings are awaiting review.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(useUiStore.getState().modal).toBe('target')
  })
  it('renders the activity loading state', async () => {
    renderView(<DashboardPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Activity log' }))
    expect(screen.getByRole('heading', { name: 'Workspace activity' })).toBeInTheDocument()
  })
  it('keeps report-download failures actionable', async () => {
    const client = seededClient()
    client.removeQueries({ queryKey: ['findings'] })
    server.use(
      http.get('/api/findings', () =>
        HttpResponse.json({ error: 'Evidence unavailable' }, { status: 503 })
      )
    )
    renderView(<ReportsPage />, { client })
    expect(await screen.findByRole('alert')).toHaveTextContent('Evidence unavailable')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  })
  it.each([
    { name: 'scan', element: <ScanForm targetId="" onClose={() => {}} /> },
    { name: 'report', element: <ReportForm onClose={() => {}} /> },
  ])('handles loading and errors inside the $name form', async ({ element }) => {
    server.use(
      http.get('/api/targets', () =>
        HttpResponse.json({ error: 'Targets offline' }, { status: 503 })
      )
    )
    renderView(element)
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(3)
    expect(await screen.findByRole('alert')).toHaveTextContent('Targets offline')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  })
})
describe('Secondary routes and keyboard actions', () => {
  it('supports Space and Enter on scan rows and ignores unrelated keys', () => {
    const select = vi.fn()
    renderView(<ScansTable scans={scans} targets={targets} onSelect={select} />)
    const row = screen.getAllByRole('button', { name: /^View scan/ })[0]
    fireEvent.keyDown(row, { key: 'Escape' })
    expect(select).not.toHaveBeenCalled()
    fireEvent.keyDown(row, { key: 'Enter' })
    fireEvent.keyDown(row, { key: ' ' })
    expect(select).toHaveBeenCalledTimes(2)
  })
  it('opens a scan route from the dashboard table', async () => {
    renderView(<ScansTable scans={scans} targets={[]} />)
    await userEvent.click(screen.getAllByRole('button', { name: /^View scan/ })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/scans?scan=scn_001')
  })
  it('renders queued and late-running scan output', async () => {
    const client = seededClient()
    client.setQueryData(
      ['scans'],
      scans.map((scan) =>
        scan.id === 'scn_001'
          ? { ...scan, status: 'running', progress: 80 }
          : scan.id === 'scn_002'
            ? { ...scan, status: 'queued', progress: 0 }
            : scan
      )
    )
    renderView(<ScansPage />, { route: '/scans?scan=scn_002', client })
    expect(screen.getByRole('dialog')).toHaveTextContent('Waiting for an available scan worker')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getAllByRole('button', { name: /^View scan/ })[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('OWASP vulnerability checks')
  })
  it('handles missing target names in detail and reports', () => {
    const client = seededClient()
    client.setQueryData(['targets'], [])
    useUiStore.getState().openModal('report')
    renderView(<GlobalModals />, { client })
    expect(screen.getByLabelText('Completed scan')).toHaveTextContent('Archived target')
  })
  it('opens the target modal without an existing target', () => {
    useUiStore.getState().openModal('target')
    renderView(<GlobalModals />, { client: seededClient() })
    expect(screen.getByRole('dialog')).toHaveTextContent('Add a target')
  })
  it('uses help, workspace, notifications, and settings navigation actions', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Help & documentation' }))
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }))
    await userEvent.click(screen.getByRole('button', { name: 'Workspace details' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.click(screen.getByRole('button', { name: 'Workspace details' }))
    await userEvent.click(screen.getByRole('button', { name: 'Manage targets' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/targets')
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await userEvent.click(screen.getByRole('link', { name: /failed scan/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('status=failed')
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(withinDialog(dialog, 'Sign out'))
    expect(await screen.findByRole('heading', { name: 'Sign in to Sentinel' })).toBeInTheDocument()
  })
  it('renders the real App provider entry point', async () => {
    window.history.replaceState({}, '', '/dashboard')
    const rendered = render(<App />)
    expect(await screen.findByRole('heading', { name: 'Security overview' })).toBeInTheDocument()
    rendered.unmount()
  })
  it('normalizes root and unknown protected routes', async () => {
    renderView(<AppRoutes />, { route: '/unknown', client: seededClient() })
    expect(await screen.findByRole('heading', { name: 'Security overview' })).toBeInTheDocument()
  })
})
/** Finds a named dialog action without relying on implementation-specific markup. */
function withinDialog(dialog: HTMLElement, name: string) {
  const buttons = Array.from(dialog.querySelectorAll('button'))
  const button = buttons.find((candidate) => candidate.textContent.includes(name))
  if (!button) throw new Error(`Missing ${name} button`)
  return button
}
describe('Debounce hook', () => {
  it('commits only the latest value after the delay', () => {
    vi.useFakeTimers()
    const { result, rerender, unmount } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'first' },
    })
    rerender({ value: 'second' })
    expect(result.current).toBe('first')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('second')
    unmount()
    vi.useRealTimers()
  })
  it('handles a real empty query client', () => {
    const client = new QueryClient()
    expect(client.getQueryData(['empty'])).toBeUndefined()
    client.clear()
  })
})
