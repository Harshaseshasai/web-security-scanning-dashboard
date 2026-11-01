import { AlertTriangle, RotateCcw, SearchX } from 'lucide-react'
import { Button } from './Button'
import { CONTENT } from '@/config/content'

/** Keeps API failures visible until the analyst explicitly retries. */
export function ErrorState({ error, retry }: { error: Error | null; retry: () => void }) {
  return (
    <div className="error-state" role="alert" aria-live="polite">
      <AlertTriangle size={23} aria-hidden="true" />
      <div>
        <h3>{CONTENT.common.errorTitle}</h3>
        <p>{error?.message ?? CONTENT.common.errorFallback}</p>
      </div>
      <Button onClick={retry} small>
        <RotateCcw size={14} aria-hidden="true" />
        {CONTENT.common.retry}
      </Button>
    </div>
  )
}

/** Explains an empty data view and offers its next relevant action. */
export function EmptyState({
  title = CONTENT.common.noResultsTitle,
  description = CONTENT.common.noResultsDescription,
  action = CONTENT.common.clearFilters,
  onAction,
}: {
  title?: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state" aria-label={title}>
      <SearchX className="empty-illustration" size={27} strokeWidth={1.3} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {onAction ? <Button onClick={onAction}>{action}</Button> : null}
    </div>
  )
}

/** Preserves table dimensions while validated data is still loading. */
export function TableSkeleton({ columns = 6, rows = 20 }: { columns?: number; rows?: number }) {
  return (
    <div className="table-scroll" aria-busy="true" aria-label={CONTENT.common.scanning}>
      <table className="data-table skeleton-table">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} data-testid="skeleton-row">
              {Array.from({ length: columns }, (_, column) => (
                <td key={column}>
                  <div className={`skeleton ${column === 0 ? 'skeleton-long' : ''}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
