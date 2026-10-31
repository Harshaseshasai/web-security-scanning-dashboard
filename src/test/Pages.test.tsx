import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import FindingsPage from '../pages/FindingsPage'
import FindingDetailPage from '../pages/FindingDetailPage'
import TargetsPage from '../pages/TargetsPage'
import ScansPage from '../pages/ScansPage'
import ReportsPage from '../pages/ReportsPage'
import DashboardPage from '../pages/DashboardPage'
import { GlobalModals } from '../components/layout/GlobalModals'
import { AppRoutes } from '../router'
import { renderView, resetStores, seededClient } from './render'
import { useUiStore } from '../store/ui.store'
import { useFindingStore } from '../store/findings-filter.store'
import { useThemeStore } from '../store/theme.store'
import { server } from './setup'
import { findings } from '../mocks/data/findings'

beforeEach(resetStores)
describe('Findings workflow', () => {
  it('debounces search, writes URL state, and resets the page', async () => {
    renderView(<FindingsPage />, { route: '/findings?page=2', client: seededClient() })
    fireEvent.change(
      screen.getByLabelText('Search findings by title, description, location or CWE'),
      { target: { value: 'sql' } }
    )
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('search=sql'))
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(4)
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=2')
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    await waitFor(() => {
      expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(20)
    })
  })
  it('combines multiple filters and clears them', async () => {
    renderView(<FindingsPage />, { client: seededClient() })
    await userEvent.click(screen.getAllByRole('button', { name: 'Severity' })[0])
    await userEvent.click(screen.getByLabelText('Critical'))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getAllByRole('button', { name: 'Category' })[0])
    await userEvent.click(screen.getByLabelText('A03: Injection'))
    await userEvent.keyboard('{Escape}')
    await userEvent.selectOptions(screen.getByLabelText('Filter by target'), 'tgt_001')
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(20)
  })
  it('cycles sort none to ascending to descending to none', async () => {
    renderView(<FindingsPage />, { client: seededClient() })
    const sort = screen.getByRole('button', { name: 'Finding' })
    await userEvent.click(sort)
    expect(screen.getByTestId('location')).toHaveTextContent('direction=asc')
    await userEvent.click(sort)
    expect(screen.getByTestId('location')).toHaveTextContent('direction=desc')
    await userEvent.click(sort)
    expect(screen.getByTestId('location')).not.toHaveTextContent('direction=')
  })
  it('paginates with a shareable URL', async () => {
    renderView(<FindingsPage />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
    expect(screen.getByText(/Showing/)).toHaveTextContent('21-40')
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(screen.getByText(/Showing/)).toHaveTextContent('1-20')
  })
  it('filters status tabs and resets to all findings', async () => {
    renderView(<FindingsPage />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Resolved' }))
    expect(screen.getByTestId('location')).toHaveTextContent('status=resolved')
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByTestId('location')).toHaveTextContent('status=open')
    await userEvent.click(screen.getByRole('button', { name: /All findings/ }))
    expect(screen.getByTestId('location')).not.toHaveTextContent('status=')
  })
  it('supports select, export, batch confirm, and clearing selection', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderView(<FindingsPage />, { client: seededClient() })
    await userEvent.click(screen.getByLabelText('Select FND-1048'))
    await userEvent.click(screen.getByRole('button', { name: 'Export selection' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm open findings' }))
    expect(useFindingStore.getState().overrides['FND-1048']).toBe('confirmed')
    await userEvent.click(screen.getByLabelText('Select FND-1047'))
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(useUiStore.getState().selectedRows).toEqual([])
    await userEvent.click(screen.getByRole('button', { name: 'Export findings' }))
  })
  it('supports per-scan findings and clearing the scan filter', async () => {
    renderView(<FindingsPage />, { route: '/findings?scan=scn_003', client: seededClient() })
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(8)
    await userEvent.click(screen.getByRole('button', { name: 'Clear scan filter' }))
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(20)
  })
  it('resets an empty search result', async () => {
    renderView(<FindingsPage />, { route: '/findings?search=doesnotexist', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getAllByRole('row', { name: /^View / })).toHaveLength(20)
  })
})
describe('Finding details', () => {
  it('shows evidence, changes valid statuses, and copies a request', async () => {
    const user = userEvent.setup()
    renderView(<FindingDetailPage />, {
      route: '/findings/FND-1048',
      path: '/findings/:id',
      client: seededClient(),
    })
    expect(
      screen.getByRole('heading', { name: 'SQL injection in search endpoint' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Change finding status')).toHaveValue('')
    expect(screen.getByText('Current status').parentElement).toHaveTextContent('Open')
    await user.selectOptions(screen.getByLabelText('Change finding status'), 'confirmed')
    expect(useFindingStore.getState().overrides['FND-1048']).toBe('confirmed')
    await user.selectOptions(screen.getByLabelText('Change finding status'), 'resolved')
    await user.selectOptions(screen.getByLabelText('Change finding status'), 'open')
    await user.selectOptions(screen.getByLabelText('Change finding status'), 'false_positive')
    await user.selectOptions(screen.getByLabelText('Change finding status'), 'open')
    await user.click(screen.getByRole('button', { name: 'Copy request' }))
    expect(await navigator.clipboard.readText()).toContain('GET /api/v1/search')
  })
  it('handles unavailable clipboard access', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    renderView(<FindingDetailPage />, {
      route: '/findings/FND-1048',
      path: '/findings/:id',
      client: seededClient(),
    })
    await user.click(screen.getByRole('button', { name: 'Copy response' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })
})
describe('Targets, scans, and reports', () => {
  it('searches and filters targets and opens management dialogs', async () => {
    renderView(
      <>
        <TargetsPage />
        <GlobalModals />
      </>,
      { client: seededClient() }
    )
    await userEvent.selectOptions(screen.getByLabelText('Filter environment'), 'dev')
    expect(screen.getByText('Internal API')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search targets'), { target: { value: 'missing' } })
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Add a target')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit Customer application' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Edit target')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getAllByRole('button', { name: 'Scan' })[2])
    expect(screen.getByRole('dialog')).toHaveTextContent('Start a new scan')
  })
  it('cancels and confirms optimistic target deletion', async () => {
    server.use(http.delete('/api/targets/tgt_006', () => HttpResponse.json({ success: true })))
    const client = seededClient()
    renderView(<TargetsPage />, { client })
    await userEvent.click(screen.getByRole('button', { name: 'Delete Internal API' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete Internal API' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove target' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  it('rolls back a failed target deletion', async () => {
    server.use(
      http.delete('/api/targets/tgt_006', () =>
        HttpResponse.json({ error: 'Deletion failed' }, { status: 503 })
      )
    )
    renderView(<TargetsPage />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Delete Internal API' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove target' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Deletion failed')
    expect(screen.getByRole('button', { name: 'Remove target' })).toBeEnabled()
  })
  it('filters scans and opens progress and completed details', async () => {
    renderView(<ScansPage />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: /^Completed/ }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: /^View scan/ })[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('Assessment completed')
    await userEvent.click(screen.getByRole('button', { name: 'View findings' }))
    expect(screen.getByTestId('location')).toHaveTextContent('scan=scn_003')
  })
  it('opens running scan output and closes it', async () => {
    renderView(<ScansPage />, { route: '/scans?scan=scn_001', client: seededClient() })
    expect(screen.getByRole('dialog')).toHaveTextContent('Analyzing attack surface')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('retries a failed scan and launches a new scan', async () => {
    renderView(<ScansPage />, { route: '/scans?scan=scn_009', client: seededClient() })
    expect(screen.getByRole('dialog')).toHaveTextContent('Target stopped responding')
    await userEvent.click(screen.getByRole('button', { name: 'Retry scan' }))
    expect(useUiStore.getState().modal).toBe('scan')
    await userEvent.click(screen.getByRole('button', { name: 'New scan' }))
    expect(useUiStore.getState().modal).toBe('scan')
  })
  it('searches reports, clears filters, downloads, and starts generation', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderView(<ReportsPage />, { client: seededClient() })
    fireEvent.change(screen.getByLabelText('Search reports'), { target: { value: 'missing' } })
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    await userEvent.click(screen.getAllByRole('button', { name: /^Download / })[0])
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Generate report' }))
    expect(useUiStore.getState().modal).toBe('report')
  })
  it('exposes the brief-required PDF placeholder without downloading a fake file', async () => {
    const info = vi.spyOn(toast, 'info').mockImplementation(() => 'pdf-placeholder')
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderView(<ReportsPage />, { client: seededClient() })
    await userEvent.click(screen.getAllByRole('button', { name: /^Download PDF for/ })[0])
    expect(info).toHaveBeenCalledWith(expect.stringContaining('demo placeholder'))
    expect(download).not.toHaveBeenCalled()
  })
})
describe('Dashboard and shell', () => {
  it('prioritizes unresolved critical work ahead of secondary KPIs', () => {
    renderView(<DashboardPage />, { client: seededClient() })
    const priorities = screen.getByRole('region', { name: 'Assessment priorities' })
    expect(priorities).toHaveTextContent('4 targets affected')
    expect(priorities).toHaveTextContent('35')
    expect(priorities).toHaveTextContent('Scans run12')
    expect(priorities).toHaveTextContent('Targets6')
    expect(within(priorities).getByRole('link', { name: 'Review critical queue' })).toHaveAttribute(
      'href',
      '/findings?severity=critical&status=open,confirmed'
    )
    expect(within(priorities).getByRole('link', { name: /Oldest in queue/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/findings/FND-')
    )
  })
  it('renders honest totals, date controls, and activity', async () => {
    renderView(<DashboardPage />, { client: seededClient() })
    expect(screen.getByRole('heading', { name: 'Security overview' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Chart time range'), '7')
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('7 days'))
    await userEvent.click(screen.getByRole('button', { name: /Date range/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Last 30 days' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Activity log' }))
    expect(screen.getByRole('heading', { name: 'Workspace activity' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Overview' }))
    await userEvent.click(screen.getByRole('button', { name: 'New scan' }))
    expect(useUiStore.getState().modal).toBe('scan')
  })
  it('supports header search, sidebar controls, theme settings, and sign-out', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(useUiStore.getState().collapsed).toBe(true)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByLabelText('Search findings')).toHaveFocus()
    fireEvent.change(screen.getByLabelText('Search findings'), { target: { value: 'sql' } })
    fireEvent.submit(screen.getByLabelText('Search findings').closest('form')!)
    expect(screen.getByTestId('location')).toHaveTextContent('/findings?search=sql')
    await userEvent.click(screen.getByRole('button', { name: 'Account settings' }))
    expect(screen.getByLabelText('API key')).toBeDisabled()
    expect(screen.getByText('Not connected in this demo. No key is stored.')).toBeInTheDocument()
    useThemeStore.setState({ theme: 'light' })
    await userEvent.click(screen.getByRole('button', { name: 'Dark mode' }))
    await userEvent.click(screen.getByRole('button', { name: 'Light mode' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Sign in to Sentinel' })).toBeInTheDocument()
  })
  it.each(['help', 'notifications', 'workspace'] as const)(
    'opens the %s utility dialog',
    async (modal) => {
      useUiStore.getState().openModal(modal)
      renderView(<GlobalModals />, { client: seededClient() })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
      expect(useUiStore.getState().modal).toBeNull()
    }
  )
  it('opens and closes mobile navigation', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(useUiStore.getState().mobileOpen).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(useUiStore.getState().mobileOpen).toBe(false)
  })
  it('opens a notification and navigates to critical findings', async () => {
    useUiStore.getState().openModal('notifications')
    renderView(<GlobalModals />, { client: seededClient() })
    await userEvent.click(screen.getByRole('link', { name: /critical findings need attention/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('severity=critical')
  })
  it('shows an empty notification state after critical findings are triaged', () => {
    const client = seededClient()
    client.setQueryData(
      ['findings'],
      findings.map((finding) => ({ ...finding, status: 'resolved' }))
    )
    useUiStore.getState().openModal('notifications')
    renderView(<GlobalModals />, { client })
    expect(
      within(screen.getByRole('dialog')).getByText('No critical findings need your attention.')
    ).toBeInTheDocument()
  })
})
