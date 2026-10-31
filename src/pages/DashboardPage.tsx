import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, Check, ChevronDown, ScanLine } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/DataState'
import { useFindings, useScans, useTargets } from '../hooks/use-data'
import { useUiStore } from '../store/ui.store'
import { FindingsChart } from '../components/features/dashboard/FindingsChart'
import { ScansTable } from '../components/features/scans/ScansTable'
import { SeveritySchema } from '../schemas/finding.schema'
import { capitalize, relativeTime } from '../lib/utils'
import { CONTENT } from '../config/content'

/** Reconciles targets, findings, and scans into the overview and activity log. */
export default function DashboardPage() {
  const targets = useTargets()
  const scans = useScans()
  const findings = useFindings()
  const openModal = useUiStore((state) => state.openModal)
  const [tab, setTab] = useState('overview')
  const [days, setDays] = useState(14)
  const [dateOpen, setDateOpen] = useState(false)
  const open = findings.data?.filter((finding) => ['open', 'confirmed'].includes(finding.status))
  const criticalFindings = open?.filter((finding) => finding.severity === 'critical') ?? []
  const critical = criticalFindings.length
  const affectedTargets = new Set(criticalFindings.map((finding) => finding.targetId)).size
  // Within the critical tier, surface the oldest unresolved item before newer discoveries.
  const oldestCritical =
    criticalFindings.length > 0
      ? [...criticalFindings].sort((a, b) => a.discoveredAt.localeCompare(b.discoveredAt))[0]
      : undefined
  const focusTarget = targets.data?.find((target) => target.id === oldestCritical?.targetId)
  const active =
    scans.data?.filter((scan) => ['running', 'queued'].includes(scan.status)).length ?? 0
  return (
    <>
      <PageHeader
        title={CONTENT.dashboard.title}
        description={
          findings.data && targets.data
            ? critical > 0
              ? CONTENT.dashboard.criticalSummary
                  .replace('{critical}', String(critical))
                  .replace('{targets}', String(affectedTargets))
              : CONTENT.dashboard.clearSummary.replace('{targets}', String(targets.data.length))
            : CONTENT.dashboard.loadingDescription
        }
        actions={
          <>
            <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
              <Popover.Trigger asChild>
                <Button className="date-button">
                  <CalendarDays size={13} />
                  <span className="date-range-full">
                    Oct {32 - Math.min(days, 30)} - Oct 31, 2026
                  </span>
                  <span className="sr-only">{CONTENT.dashboard.dateRange}</span>
                  <ChevronDown size={12} />
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="popover-content date-menu" sideOffset={7} align="end">
                  {[7, 14, 30].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDays(range)
                        setDateOpen(false)
                      }}
                    >
                      {CONTENT.dashboard.datePresets.replace('{days}', String(range))}
                      {days === range && <Check size={13} aria-hidden="true" />}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <Button
              variant="primary"
              onClick={() => {
                openModal('scan')
              }}
            >
              <ScanLine size={14} aria-hidden="true" />
              {CONTENT.dashboard.newScan}
            </Button>
          </>
        }
      />
      <div className="tabs-row">
        <div className="tabs" role="tablist" aria-label={CONTENT.dashboard.overviewTab}>
          <button
            role="tab"
            aria-selected={tab === 'overview'}
            className={`tab ${tab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setTab('overview')
            }}
          >
            {CONTENT.dashboard.overviewTab}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'activity'}
            className={`tab ${tab === 'activity' ? 'active' : ''}`}
            onClick={() => {
              setTab('activity')
            }}
          >
            {CONTENT.dashboard.activityTab}
          </button>
        </div>
      </div>
      {tab === 'overview' ? (
        <>
          <section className="risk-summary" aria-label={CONTENT.dashboard.priorityRegion}>
            <div className="risk-lead">
              <div className="risk-topline">
                <span>{CONTENT.dashboard.priorityLabel}</span>
                <span className="mono muted">
                  {findings.data ? `${affectedTargets} ${CONTENT.dashboard.targetsAffected}` : CONTENT.dashboard.loadingFindings}
                </span>
              </div>
              <div className="risk-measure">
                <div className="risk-number">
                  {findings.data ? critical : <div className="skeleton risk-skeleton" />}
                </div>
                <div className="risk-context">
                  <h2>{CONTENT.dashboard.priorityHeading}</h2>
                  <p>
                    {!findings.data
                      ? CONTENT.dashboard.priorityLoading
                      : critical > 0
                        ? CONTENT.dashboard.priorityPrompt
                        : CONTENT.dashboard.priorityClear}
                  </p>
                </div>
              </div>
              {oldestCritical && (
                <Link className="risk-first" to={`/findings/${oldestCritical.id}`}>
                  <span>{CONTENT.dashboard.oldestFinding}</span>
                  <strong>{oldestCritical.title}</strong>
                  <span className="mono muted">
                    {focusTarget?.name ?? oldestCritical.targetId} / {oldestCritical.cwe}
                  </span>
                </Link>
              )}
              <Link
                className="risk-link"
                to={
                  critical > 0 ? '/findings?severity=critical&status=open,confirmed' : '/findings'
                }
              >
                {critical > 0 ? CONTENT.dashboard.reviewCritical : CONTENT.dashboard.reviewAll}
              </Link>
            </div>
            <div className="supporting-metrics">
              <Link className="support-metric support-primary" to="/findings?status=open,confirmed">
                <span className="support-label">{CONTENT.dashboard.openFindings}</span>
                <strong className="support-number">
                  {open?.length ?? <span className="skeleton" />}
                </strong>
                <span className="support-note">{CONTENT.dashboard.openFindingsNote}</span>
              </Link>
              <div className="support-metric-pair">
                <Link className="support-metric" to="/scans">
                  <span className="support-label">{CONTENT.dashboard.scansRun}</span>
                  <strong className="support-number">
                    {scans.data?.length ?? <span className="skeleton" />}
                  </strong>
                  <span className="support-note">
                    {scans.data ? `${active} ${CONTENT.dashboard.scansActive}` : CONTENT.dashboard.loadingScans}
                  </span>
                </Link>
                <Link className="support-metric" to="/targets">
                  <span className="support-label">{CONTENT.dashboard.targets}</span>
                  <strong className="support-number">
                    {targets.data?.length ?? <span className="skeleton" />}
                  </strong>
                  <span className="support-note">
                    {targets.data
                      ? `${new Set(targets.data.map((target) => target.environment)).size} ${CONTENT.dashboard.targetsEnvironments}`
                      : CONTENT.dashboard.loadingTargets}
                  </span>
                </Link>
              </div>
            </div>
          </section>
          {(targets.isError || scans.isError) && (
            <ErrorState
              error={targets.error ?? scans.error}
              retry={() => {
                void targets.refetch()
                void scans.refetch()
              }}
            />
          )}
          {findings.isError ? (
            <ErrorState error={findings.error} retry={() => void findings.refetch()} />
          ) : findings.isLoading ? (
            <div className="panel" style={{ marginBottom: 23 }}>
              <TableSkeleton rows={5} />
            </div>
          ) : findings.data === undefined || findings.data.length === 0 ? (
            <div className="panel">
              <EmptyState
                title={CONTENT.dashboard.noFindingsTitle}
                description={CONTENT.dashboard.noFindingsDescription}
                action={CONTENT.dashboard.addTarget}
                onAction={() => {
                  openModal('target')
                }}
              />
            </div>
          ) : (
            <div className="chart-grid">
              <FindingsChart findings={findings.data} days={days} setDays={setDays} />
              <section className="panel severity-panel" aria-labelledby="severity-heading">
                <div className="panel-heading">
                  <div>
                    <h2 id="severity-heading">{CONTENT.dashboard.severityTitle}</h2>
                    <p>{CONTENT.dashboard.severityDescription}</p>
                  </div>
                </div>
                <div className="severity-bars">
                  <div className="severity-total">
                    {findings.data.length}
                    <span>{CONTENT.dashboard.totalFindings}</span>
                  </div>
                  {SeveritySchema.options.map((severity) => {
                    const count =
                      findings.data?.filter((finding) => finding.severity === severity).length ?? 0
                    return (
                      <Link
                        to={`/findings?severity=${severity}`}
                        className={`severity-bar-row severity-${severity}`}
                        key={severity}
                      >
                        <span className="severity-bar-label">
                          <i />
                          {capitalize(severity)}
                        </span>
                        <span className="severity-bar-track">
                          <span
                            className="severity-bar-fill"
                            style={{
                              display: 'block',
                              width: `${(count / Math.max(...SeveritySchema.options.map((value) => findings.data?.filter((f) => f.severity === value).length ?? 1))) * 100}%`,
                            }}
                          />
                        </span>
                        <strong>{count}</strong>
                      </Link>
                    )
                  })}
                </div>
                <Link to="/findings" className="panel-bottom-link">
                  {CONTENT.dashboard.reviewFindings}
                </Link>
              </section>
            </div>
          )}
          <section className="panel recent-scans">
            <div className="panel-heading">
              <div>
                <h2>{CONTENT.dashboard.recentScans}</h2>
                <p>{CONTENT.dashboard.recentScansDescription}</p>
              </div>
              <Link to="/scans" className="section-link">
                {CONTENT.dashboard.viewAllScans}
              </Link>
            </div>
            {scans.isLoading || targets.isLoading ? (
              <TableSkeleton rows={4} />
            ) : scans.isError ? (
              <ErrorState error={scans.error} retry={() => void scans.refetch()} />
            ) : (
              <ScansTable
                scans={scans.data?.slice(0, 4) ?? []}
                targets={targets.data ?? []}
                compact
              />
            )}
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="panel-heading" style={{ paddingBottom: 18 }}>
            <h2>{CONTENT.dashboard.activityTitle}</h2>
          </div>
          {scans.isLoading ? (
            <TableSkeleton rows={8} />
          ) : scans.isError ? (
            <ErrorState error={scans.error} retry={() => void scans.refetch()} />
          ) : (
            scans.data?.map((scan) => (
              <Link className="activity-item" key={scan.id} to={`/scans?scan=${scan.id}`}>
                <div>
                  <h3>
                    {capitalize(scan.status)} scan on{' '}
                    {targets.data?.find((target) => target.id === scan.targetId)?.name ??
                      'archived target'}
                  </h3>
                  <p className="mono">
                    {scan.id} / {scan.progress}% complete
                  </p>
                </div>
                <time>{relativeTime(scan.startedAt)}</time>
              </Link>
            ))
          )}
        </section>
      )}
    </>
  )
}
