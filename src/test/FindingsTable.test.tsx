import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FindingsTable } from '../components/features/findings/FindingsTable'
import { findings } from '../mocks/data/findings'
import { targets } from '../mocks/data/targets'
import { FilterSchema } from '../schemas/finding.schema'
import { renderView, resetStores } from './render'

beforeEach(resetStores)
const defaults = {
  findings: findings.slice(0, 20),
  targets,
  total: 48,
  filters: FilterSchema.parse({}),
  onSort: vi.fn(),
  onPage: vi.fn(),
  onReset: vi.fn(),
}
describe('FindingsTable', () => {
  it('renders 20 rows and textual severity labels', () => {
    renderView(<FindingsTable {...defaults} />)
    expect(screen.getAllByRole('row', { name: /^Open finding/ })).toHaveLength(20)
    expect(screen.getAllByLabelText('Severity: Critical')).toHaveLength(4)
  })
  it('navigates from a row click', async () => {
    renderView(<FindingsTable {...defaults} />)
    await userEvent.click(screen.getAllByRole('row', { name: /^Open finding/ })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/findings/fnd_5231')
  })
  it.each(['Enter', ' '])('navigates from the %s key', (key) => {
    renderView(<FindingsTable {...defaults} />)
    fireEvent.keyDown(screen.getAllByRole('row', { name: /^Open finding/ })[0], { key })
    expect(screen.getByTestId('location')).toHaveTextContent('/findings/fnd_5231')
  })
  it('does not navigate on unrelated keys', () => {
    renderView(<FindingsTable {...defaults} />)
    fireEvent.keyDown(screen.getAllByRole('row', { name: /^Open finding/ })[0], { key: 'Escape' })
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
  it('exposes sort state and triggers sort buttons', async () => {
    const onSort = vi.fn()
    renderView(<FindingsTable {...defaults} onSort={onSort} />)
    expect(
      screen
        .getAllByRole('columnheader')
        .filter((cell) => cell.hasAttribute('aria-sort'))
        .every((cell) => cell.getAttribute('aria-sort') === 'none')
    ).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Finding' }))
    expect(onSort).toHaveBeenCalledWith('title')
  })
  it('has a dedicated, sortable CWE column', async () => {
    const onSort = vi.fn()
    renderView(<FindingsTable {...defaults} onSort={onSort} />)
    expect(screen.getByRole('columnheader', { name: 'CWE' })).toHaveAttribute('aria-sort', 'none')
    await userEvent.click(screen.getByRole('button', { name: 'CWE' }))
    expect(onSort).toHaveBeenCalledWith('cwe')
    expect(screen.getAllByText('CWE-89').length).toBeGreaterThan(0)
  })
  it.each(['asc', 'desc'] as const)('shows the %s sorting indicator', (direction) => {
    renderView(
      <FindingsTable {...defaults} filters={{ ...defaults.filters, sort: 'title', direction }} />
    )
    expect(screen.getByRole('columnheader', { name: 'Finding' })).toHaveAttribute(
      'aria-sort',
      direction === 'asc' ? 'ascending' : 'descending'
    )
  })
  it('advances pages and disables the previous button on page one', async () => {
    const onPage = vi.fn()
    renderView(<FindingsTable {...defaults} onPage={onPage} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPage).toHaveBeenCalledWith(2)
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(onPage).toHaveBeenCalledWith(3)
  })
  it('allows previous page and disables next on the final page', async () => {
    const onPage = vi.fn()
    renderView(
      <FindingsTable
        {...defaults}
        findings={findings.slice(40)}
        filters={{ ...defaults.filters, page: 3 }}
        onPage={onPage}
      />
    )
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(onPage).toHaveBeenCalledWith(2)
  })
  it('condenses large page ranges', () => {
    renderView(
      <FindingsTable {...defaults} total={250} filters={{ ...defaults.filters, page: 7 }} />
    )
    expect(screen.getByRole('button', { name: 'Page 13' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument()
  })
  it('renders exactly 20 noninteractive skeleton rows', () => {
    renderView(<FindingsTable {...defaults} isLoading />)
    const skeletons = screen.getAllByTestId('skeleton-row')
    expect(skeletons).toHaveLength(20)
    skeletons.forEach((row) => expect(row).not.toHaveAttribute('tabindex'))
  })
  it('renders a contextual empty state and reset action', async () => {
    const onReset = vi.fn()
    renderView(<FindingsTable {...defaults} findings={[]} onReset={onReset} />)
    expect(screen.getByLabelText('No findings match your filters')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onReset).toHaveBeenCalledOnce()
  })
  it('persists an inline error with a retry action', async () => {
    const onRetry = vi.fn()
    renderView(<FindingsTable {...defaults} error={new Error('Offline')} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Offline')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('selects a row without navigating', async () => {
    const onSelect = vi.fn()
    renderView(<FindingsTable {...defaults} onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText('Select fnd_5231'))
    expect(onSelect).toHaveBeenCalledWith(['fnd_5231'])
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
  it('deselects a row without navigating', async () => {
    const onSelect = vi.fn()
    renderView(<FindingsTable {...defaults} selected={['fnd_5231']} onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText('Select fnd_5231'))
    expect(onSelect).toHaveBeenCalledWith([])
  })
  it('selects all visible rows', async () => {
    const onSelect = vi.fn()
    renderView(<FindingsTable {...defaults} onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText('Select all findings on this page'))
    expect(onSelect).toHaveBeenCalledWith(defaults.findings.map((finding) => finding.id))
  })
  it('deselects all visible rows while retaining other pages', async () => {
    const onSelect = vi.fn()
    renderView(
      <FindingsTable
        {...defaults}
        selected={findings.map((finding) => finding.id)}
        onSelect={onSelect}
      />
    )
    await userEvent.click(screen.getByLabelText('Select all findings on this page'))
    expect(onSelect).toHaveBeenCalledWith(findings.slice(20).map((finding) => finding.id))
  })
  it('does not hijack a checkbox keyboard event', () => {
    renderView(<FindingsTable {...defaults} />)
    fireEvent.keyDown(screen.getByLabelText('Select fnd_5231'), { key: ' ' })
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
  it('uses finding location when a target is archived', () => {
    renderView(<FindingsTable {...defaults} targets={[]} />)
    expect(
      within(screen.getAllByRole('row', { name: /^Open finding/ })[0]).getByText(
        'www.westhaven.example'
      )
    ).toBeInTheDocument()
  })
})
