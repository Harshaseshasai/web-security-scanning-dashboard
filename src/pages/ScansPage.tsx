import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, ScanLine } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ErrorState, TableSkeleton } from '../components/ui/DataState'
import { ScanStatusBadge, ScanStatusMark } from '../components/ui/Badges'
import { Modal } from '../components/ui/Modal'
import { ScansTable } from '../components/features/scans/ScansTable'
import { useScans, useTargets } from '../hooks/use-data'
import { useUiStore } from '../store/ui.store'
import { formatDuration } from '../lib/utils'
import { CONTENT } from '../config/content'
import { SCAN_STATUS_CONFIG } from '../config/status.config'
import type { Scan } from '../types'

/** Filters scans and keeps the selected progress dialog in the URL. */
export default function ScansPage() {
  const scans = useScans()
  const targets = useTargets()
  const openModal = useUiStore((state) => state.openModal)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const status = params.get('status') ?? 'all'
  const selected = scans.data?.find((scan) => scan.id === params.get('scan'))
  const visible = scans.data?.filter((scan) => status === 'all' || scan.status === status) ?? []
  /** Removes the scan dialog parameter without clearing the active status filter. */
  const close = () => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('scan')
      return next
    })
  }

  /** Selects a scan in the URL so its progress dialog can be shared and revisited. */
  const selectScan = (scan: Scan) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('scan', scan.id)
      return next
    })
  }
  return (
    <>
      <PageHeader
        title={CONTENT.scans.title}
        description={CONTENT.scans.description}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              openModal('scan')
            }}
          >
            <ScanLine size={14} aria-hidden="true" />
            {CONTENT.scans.new}
          </Button>
        }
      />
      <div className="scan-filter-tabs" aria-label={CONTENT.scans.statusFilter}>
        {['all', ...Object.keys(SCAN_STATUS_CONFIG)].map((value) => (
          <button
            key={value}
            className={status === value ? 'active' : ''}
            aria-pressed={status === value}
            onClick={() => {
              setParams(value === 'all' ? {} : { status: value })
            }}
          >
            {value !== 'all' && (
              <ScanStatusMark status={value as keyof typeof SCAN_STATUS_CONFIG} />
            )}
            {value === 'all'
              ? CONTENT.scans.allStatuses
              : SCAN_STATUS_CONFIG[value as keyof typeof SCAN_STATUS_CONFIG].label}
            <span>
              {scans.data?.filter((scan) => value === 'all' || scan.status === value).length ?? 0}
            </span>
          </button>
        ))}
      </div>
      <section className="panel">
        {scans.isLoading || targets.isLoading ? (
          <TableSkeleton rows={10} />
        ) : scans.isError || targets.isError ? (
          <ErrorState
            error={scans.error ?? targets.error}
            retry={() => {
              void scans.refetch()
              void targets.refetch()
            }}
          />
        ) : (
          <ScansTable scans={visible} targets={targets.data ?? []} onSelect={selectScan} />
        )}
      </section>
      <Modal
        open={selected !== undefined}
        onClose={close}
        title={CONTENT.scans.details}
        description={
          selected
            ? `${targets.data?.find((target) => target.id === selected.targetId)?.name ?? selected.targetId} / ${selected.id}`
            : ''
        }
        wide
      >
        {selected && (
          <>
            <div className="detail-meta">
              <ScanStatusBadge status={selected.status} />
              <span className="mono muted">{formatDuration(selected.durationSec)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 21 }}>
              <div
                className="progress-track"
                style={{ width: '100%', height: 6 }}
                role="progressbar"
                aria-label={CONTENT.scans.progressLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={selected.progress}
              >
                <div className="progress-fill" style={{ width: `${selected.progress}%` }} />
              </div>
              <span className="mono">{selected.progress}%</span>
            </div>
            <div className="terminal">
              <div className="terminal-heading">
                {CONTENT.scans.scannerOutput}<span className="mono">{CONTENT.scans.engine}</span>
              </div>
              <pre>{`[OK] ${CONTENT.scans.terminal.initialized}\n[OK] ${CONTENT.scans.terminal.authorized}\n${selected.progress > 10 ? `[OK] ${CONTENT.scans.terminal.discovered}\n` : ''}${selected.progress > 30 ? `[OK] ${CONTENT.scans.terminal.configuration}\n` : ''}${selected.progress > 55 ? `[OK] ${CONTENT.scans.terminal.owasp}\n` : ''}${selected.status === 'failed' ? `[ERROR] ${CONTENT.scans.terminal.failed}` : selected.status === 'completed' ? `[OK] ${CONTENT.scans.terminal.complete}` : selected.status === 'queued' ? `[WAIT] ${CONTENT.scans.terminal.waiting}` : `[RUN] ${CONTENT.scans.terminal.running}`}`}</pre>
            </div>
            <div className="modal-footer">
              <Button onClick={close}>{CONTENT.scans.close}</Button>
              {selected.status === 'completed' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    navigate(`/findings?scan=${selected.id}`)
                  }}
                >
                  {CONTENT.scans.viewFindings}
                  <ArrowRight size={13} />
                </Button>
              )}
              {selected.status === 'failed' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    close()
                    openModal('scan', selected.targetId)
                  }}
                >
                  {CONTENT.scans.retry}
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
