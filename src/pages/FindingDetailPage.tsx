import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useFinding, useTargets } from '../hooks/use-data'
import { FindingStatusBadge, SeverityBadge } from '../components/ui/Badges'
import { ErrorState, TableSkeleton } from '../components/ui/DataState'
import { TRANSITIONS } from '../lib/constants'
import { FINDING_STATUS_CONFIG } from '../config/status.config'
import { CONTENT } from '../config/content'
import { dateLabel } from '../lib/utils'
import { useFindingStore } from '../store/findings-filter.store'
import { FindingStatusSchema } from '../schemas/finding.schema'
import { IconHint } from '../components/ui/Tooltip'

/** Shows HTTP evidence, remediation, and allowed session-only status transitions. */
export default function FindingDetailPage() {
  const { id = '' } = useParams()
  const query = useFinding(id)
  const targets = useTargets()
  const setStatus = useFindingStore((state) => state.setStatus)
  const finding = query.data
  /** Copies a request or response while handling unavailable clipboard access. */
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(CONTENT.findingDetail.copied)
    } catch {
      toast.error(CONTENT.findingDetail.clipboardUnavailable)
    }
  }
  return (
    <>
      <Link className="back-link" to="/findings">
        <ArrowLeft size={13} />
        {CONTENT.findingDetail.back}
      </Link>
      {query.isLoading ? (
        <>
          <h1 className="sr-only">{CONTENT.findingDetail.loading}</h1>
          <TableSkeleton rows={12} columns={2} />
        </>
      ) : query.isError ? (
        <>
          <h1>{CONTENT.findingDetail.unavailable}</h1>
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        </>
      ) : (
        finding && (
          <>
            <div className="detail-header">
              <span className="mono muted">
                {finding.id} / {finding.cwe}
              </span>
              <h1>{finding.title}</h1>
              <div className="detail-meta">
                <SeverityBadge severity={finding.severity} />
                <FindingStatusBadge status={finding.status} />
                <span className="muted" style={{ fontSize: 11 }}>
                  {finding.category}
                </span>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <section className="detail-section">
                  <h2>{CONTENT.findingDetail.overview}</h2>
                  <p>{finding.description}</p>
                  <dl className="property" style={{ marginTop: 14 }}>
                    <dt>{CONTENT.findingDetail.affectedEndpoint}</dt>
                    <dd className="mono">{finding.location}</dd>
                  </dl>
                </section>
                <section className="detail-section">
                  <h2>{CONTENT.findingDetail.evidence}</h2>
                  <p>{CONTENT.findingDetail.evidenceDescription}</p>
                  {(['request', 'response'] as const).map((type) => (
                    <div className="terminal" key={type}>
                      <div className="terminal-heading">
                        <span className="mono">{type === 'request' ? CONTENT.findingDetail.httpRequest : CONTENT.findingDetail.httpResponse}</span>
                        <IconHint label={`${CONTENT.findingDetail.copy} ${type}`}>
                          <button
                            className="icon-button"
                            aria-label={`${CONTENT.findingDetail.copy} ${type}`}
                            onClick={() => void copy(finding.evidence[type])}
                          >
                            <Copy size={13} aria-hidden="true" />
                          </button>
                        </IconHint>
                      </div>
                      <pre>{finding.evidence[type]}</pre>
                    </div>
                  ))}
                </section>
                <section className="detail-section">
                  <h2 style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ShieldCheck size={16} />
                    {CONTENT.findingDetail.remediation}
                  </h2>
                  <p>{finding.remediation}</p>
                  <a
                    href={`https://cwe.mitre.org/data/definitions/${finding.cwe.slice(4)}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="section-link"
                    style={{ marginTop: 17, color: 'var(--link)' }}
                  >
                    Read {finding.cwe} {CONTENT.findingDetail.documentation}
                    <ExternalLink size={12} />
                  </a>
                </section>
              </div>
              <aside className="detail-sidebar" aria-label={CONTENT.findingDetail.metadataLabel}>
                <section className="detail-section">
                  <h2>{CONTENT.findingDetail.triage}</h2>
                  <div className="triage-current">
                    <span>{CONTENT.findingDetail.currentStatus}</span>
                    <FindingStatusBadge status={finding.status} />
                  </div>
                  <label className="status-label" htmlFor="finding-status">
                    {CONTENT.findingDetail.changeStatus}
                  </label>
                  <select
                    id="finding-status"
                    className="status-control"
                    value=""
                    onChange={(event) => {
                      const next = FindingStatusSchema.parse(event.target.value)
                      if (setStatus(finding.id, finding.status, next))
                        toast.success(`${FINDING_STATUS_CONFIG[next].label}: ${FINDING_STATUS_CONFIG[next].description}`)
                    }}
                  >
                    <option value="" disabled>
                      {CONTENT.findingDetail.chooseStatus}
                    </option>
                    {TRANSITIONS[finding.status].map((status) => (
                      <option key={status} value={status}>
                        {FINDING_STATUS_CONFIG[status].label}
                      </option>
                    ))}
                  </select>
                  <p className="detail-note">
                    {CONTENT.findingDetail.triageHelp}
                  </p>
                </section>
                <section className="detail-section">
                  <h2>{CONTENT.findingDetail.details}</h2>
                  <dl>
                    {[
                      {
                        label: CONTENT.findingDetail.labels.target,
                        value:
                          targets.data?.find((target) => target.id === finding.targetId)?.name ??
                          finding.targetId,
                      },
                      { label: CONTENT.findingDetail.labels.category, value: finding.category },
                      { label: CONTENT.findingDetail.labels.weakness, value: finding.cwe },
                      { label: CONTENT.findingDetail.labels.scanId, value: finding.scanId },
                      { label: CONTENT.findingDetail.labels.discovered, value: dateLabel(finding.discoveredAt) },
                    ].map(({ label, value }) => (
                      <div key={label} className="property">
                        <dt>{label}</dt>
                        <dd className={label === CONTENT.findingDetail.labels.weakness || label === CONTENT.findingDetail.labels.scanId ? 'mono' : ''}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )
      )}
    </>
  )
}
