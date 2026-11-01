import { useNavigate } from 'react-router-dom'
import { ScanStatusBadge } from '../../ui/Badges'
import { EmptyState } from '../../ui/DataState'
import { formatDuration, hostname, relativeTime } from '../../../lib/utils'
import type { Scan, Target } from '../../../types'
import { useUiStore } from '../../../store/ui.store'
import { CONTENT } from '../../../config/content'

/** Displays keyboard-operable scan rows with progress and nonzero severity counts. */
export function ScansTable({
  scans,
  targets,
  compact = false,
  onSelect,
}: {
  scans: Scan[]
  targets: Target[]
  compact?: boolean
  onSelect?: (scan: Scan) => void
}) {
  const navigate = useNavigate()
  const openModal = useUiStore((state) => state.openModal)
  /** Opens a scan in the URL unless the parent supplies its own selection handler. */
  const select = (scan: Scan) => {
    if (onSelect) onSelect(scan)
    else navigate(`/scans?scan=${scan.id}`)
  }
  if (!scans.length)
    return (
      <EmptyState
        title={CONTENT.scans.emptyTitle}
        description={CONTENT.scans.emptyDescription}
        action={CONTENT.scans.new}
        onAction={() => {
          openModal('scan')
        }}
      />
    )
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {Object.values(CONTENT.scans.columns).map((heading) => (
              <th scope="col" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => {
            const target = targets.find((item) => item.id === scan.targetId)
            const counts = Object.entries(scan.findingsCount).filter(([, count]) => count > 0)
            return (
              <tr
                key={scan.id}
                role="button"
                tabIndex={0}
                aria-label={`${CONTENT.scans.view}: ${scan.id} ${target?.name ?? CONTENT.common.noValue}`}
                onClick={() => {
                  select(scan)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    select(scan)
                  }
                }}
              >
                <td>
                  <div className="target-cell">
                    <span>
                      <span className="cell-title">{target?.name ?? scan.targetId}</span>
                      <span className="cell-subtitle">
                        {target ? hostname(target.url) : scan.targetId}
                      </span>
                    </span>
                  </div>
                </td>
                <td>
                  {scan.status === 'running' ? (
                    <div className="progress-cell">
                      <ScanStatusBadge status={scan.status} />
                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-label={CONTENT.scans.findProgress.replace('{id}', scan.id)}
                        aria-valuenow={scan.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="progress-fill" style={{ width: `${scan.progress}%` }} />
                      </div>
                      <span className="progress-percent">{scan.progress}%</span>
                    </div>
                  ) : (
                    <ScanStatusBadge status={scan.status} />
                  )}
                </td>
                <td>
                  {scan.status === 'completed' ? (
                    <div className="finding-counts">
                      {counts.length === 0 && (
                        <span className="muted">0 {CONTENT.findings.findingsSuffix}</span>
                      )}
                      {counts.map(([severity, count]) => (
                        <span key={severity} className={`scan-count ${severity}`}>
                          <strong>{count}</strong> {severity}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">{CONTENT.common.noValue}</span>
                  )}
                </td>
                <td className="muted">
                  <span className={compact ? '' : 'mono'}>{relativeTime(scan.startedAt)}</span>
                </td>
                <td>
                  <span className="mono muted">{formatDuration(scan.durationSec)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
