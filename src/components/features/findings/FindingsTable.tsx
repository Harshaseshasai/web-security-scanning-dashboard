import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FindingStatusBadge, SeverityBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/DataState'
import { dateLabel, hostname } from '@/lib/utils'
import type { Finding, Filters, Target } from '@/types'
import { CONTENT } from '@/config/content'

const columns = [
  { key: 'title', label: CONTENT.findings.columns.finding },
  { key: 'severity', label: CONTENT.findings.columns.severity },
  { key: 'category', label: CONTENT.findings.columns.category },
  { key: 'cwe', label: CONTENT.findings.columns.cwe },
  { key: 'targetId', label: CONTENT.findings.columns.target },
  { key: 'status', label: CONTENT.findings.columns.status },
  { key: 'discoveredAt', label: CONTENT.findings.columns.discovered },
]

/** Combines accessible sorting, row navigation, selection, and pagination for findings. */
export function FindingsTable({
  findings,
  targets = [],
  total,
  filters,
  onSort,
  onPage,
  onReset,
  isLoading = false,
  error = null,
  onRetry = () => {},
  selected = [],
  onSelect = () => {},
}: {
  findings: Finding[]
  targets?: Target[]
  total: number
  filters: Filters
  onSort: (column: string) => void
  onPage: (page: number) => void
  onReset: () => void
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  selected?: string[]
  onSelect?: (ids: string[]) => void
}) {
  const navigate = useNavigate()
  if (isLoading) return <TableSkeleton columns={8} rows={20} />
  if (error) return <ErrorState error={error} retry={onRetry} />
  if (!findings.length) return <EmptyState onAction={onReset} />
  const pages = Math.ceil(total / filters.pageSize)
  /** Opens finding evidence from pointer or keyboard row activation. */
  const open = (finding: Finding) => {
    navigate(`/findings/${finding.id}`)
  }

  /** Selects or clears the current page without disturbing selections on other pages. */
  const toggleAll = (checked: boolean) => {
    onSelect(
      checked
        ? [...new Set([...selected, ...findings.map((finding) => finding.id)])]
        : selected.filter((id) => !findings.some((finding) => finding.id === id))
    )
  }

  /** Updates a single finding checkbox independently of its row navigation. */
  const toggleRow = (finding: Finding, checked: boolean) => {
    onSelect(checked ? [...selected, finding.id] : selected.filter((id) => id !== finding.id))
  }

  return (
    <>
      <div className="table-scroll">
        <table className="data-table findings-table">
          <thead>
            <tr>
              <th scope="col">
                <label className="sr-only" htmlFor="select-all-findings">
                  {CONTENT.findings.allPage}
                </label>
                <input
                  className="table-checkbox"
                  id="select-all-findings"
                  type="checkbox"
                  checked={findings.every((finding) => selected.includes(finding.id))}
                  onChange={(event) => {
                    toggleAll(event.target.checked)
                  }}
                />
              </th>
              {columns.map(({ key, label }) => (
                <th
                  scope="col"
                  key={key}
                  aria-sort={
                    filters.sort === key && filters.direction !== 'none'
                      ? filters.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    className="sort-button"
                    onClick={() => {
                      onSort(key)
                    }}
                  >
                    {label}
                    {filters.sort !== key || filters.direction === 'none' ? (
                      <ArrowUpDown size={11} />
                    ) : filters.direction === 'asc' ? (
                      <ArrowUp size={11} />
                    ) : (
                      <ArrowDown size={11} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {findings.map((finding) => (
              <tr
                key={finding.id}
                // Section 9: a native row plus a real link avoids nesting selection
                // checkboxes inside a button role, while retaining Enter/Space row access.
                role="row"
                tabIndex={0}
                aria-label={`${CONTENT.findings.openFinding}: ${finding.title}, ${finding.id}`}
                onClick={() => {
                  open(finding)
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    open(finding)
                  }
                }}
              >
                <td
                  onClick={(event) => {
                    event.stopPropagation()
                  }}
                >
                  <label className="sr-only" htmlFor={`select-${finding.id}`}>
                    Select {finding.id}
                  </label>
                  <input
                    id={`select-${finding.id}`}
                    type="checkbox"
                    className="table-checkbox"
                    checked={selected.includes(finding.id)}
                    onChange={(event) => {
                      toggleRow(finding, event.target.checked)
                    }}
                  />
                </td>
                <td>
                  <Link
                    className="cell-title finding-title"
                    to={`/findings/${finding.id}`}
                    onClick={(event) => {
                      event.stopPropagation()
                    }}
                  >
                    {finding.title}
                  </Link>
                  <span className="cell-subtitle">{finding.id}</span>
                </td>
                <td>
                  <SeverityBadge severity={finding.severity} />
                </td>
                <td className="muted">{finding.category}</td>
                <td className="mono muted">{finding.cwe}</td>
                <td className="mono muted">
                  {hostname(
                    targets.find((target) => target.id === finding.targetId)?.url ??
                      finding.location
                  )}
                </td>
                <td>
                  <FindingStatusBadge status={finding.status} />
                </td>
                <td className="mono muted" style={{ fontSize: 9 }}>
                  {dateLabel(finding.discoveredAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <p>
          {CONTENT.findings.showing}{' '}
          <strong>
            {(filters.page - 1) * filters.pageSize + 1}-
            {Math.min(filters.page * filters.pageSize, total)}
          </strong>{' '}
          {CONTENT.findings.of} <strong>{total}</strong> {CONTENT.findings.findingsSuffix}
        </p>
        <div className="pagination-actions">
          <Button
            small
            disabled={filters.page === 1}
            onClick={() => {
              onPage(filters.page - 1)
            }}
            aria-label={CONTENT.findings.previous}
          >
            <ChevronLeft size={12} />
            {CONTENT.findings.previousShort}
          </Button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter(
              (page) =>
                pages < 8 || page === 1 || page === pages || Math.abs(page - filters.page) < 2
            )
            .map((page) => (
              <button
                className={`page-number ${page === filters.page ? 'active' : ''}`}
                aria-label={`${CONTENT.findings.page} ${page}`}
                aria-current={page === filters.page ? 'page' : undefined}
                key={page}
                onClick={() => {
                  onPage(page)
                }}
              >
                {page}
              </button>
            ))}
          <Button
            small
            disabled={filters.page >= pages}
            onClick={() => {
              onPage(filters.page + 1)
            }}
            aria-label={CONTENT.findings.next}
          >
            {CONTENT.findings.nextShort}
            <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </>
  )
}
