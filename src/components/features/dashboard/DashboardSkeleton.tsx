function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

export function DashboardSummarySkeleton() {
  return (
    <section
      className="risk-summary dashboard-summary-skeleton"
      data-testid="dashboard-summary-skeleton"
      role="status"
      aria-label="Loading dashboard metrics"
      aria-busy="true"
    >
      <div className="risk-lead" aria-hidden="true">
        <div className="risk-topline dashboard-summary-topline">
          <SkeletonBlock className="dashboard-summary-eyebrow" />
          <SkeletonBlock className="dashboard-summary-affected" />
        </div>
        <div className="risk-measure">
          <SkeletonBlock className="dashboard-summary-critical" />
          <div className="dashboard-summary-context">
            <SkeletonBlock className="dashboard-summary-context-title" />
            <SkeletonBlock className="dashboard-summary-context-copy" />
          </div>
        </div>
        <div className="risk-first dashboard-summary-finding">
          <SkeletonBlock className="dashboard-summary-finding-label" />
          <SkeletonBlock className="dashboard-summary-finding-title" />
          <SkeletonBlock className="dashboard-summary-finding-target" />
        </div>
        <SkeletonBlock className="dashboard-summary-link" />
      </div>
      <div className="supporting-metrics" aria-hidden="true">
        <div className="support-metric support-primary">
          <SkeletonBlock className="dashboard-summary-label" />
          <SkeletonBlock className="dashboard-summary-primary-number" />
          <SkeletonBlock className="dashboard-summary-note" />
        </div>
        <div className="support-metric-pair">
          {[0, 1].map((item) => (
            <div className="support-metric" key={item}>
              <SkeletonBlock className="dashboard-summary-label" />
              <SkeletonBlock className="dashboard-summary-number" />
              <SkeletonBlock className="dashboard-summary-note" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DashboardChartsSkeleton() {
  return (
    <div
      className="chart-grid dashboard-charts-skeleton"
      data-testid="dashboard-charts-skeleton"
      role="status"
      aria-label="Loading findings charts"
      aria-busy="true"
    >
      <section className="panel dashboard-chart-placeholder" aria-hidden="true">
        <div className="panel-heading">
          <div className="dashboard-chart-placeholder-heading">
            <SkeletonBlock className="dashboard-panel-title" />
            <SkeletonBlock className="dashboard-panel-description" />
          </div>
          <SkeletonBlock className="dashboard-period-control" />
        </div>
        <div className="chart-legend">
          <span>
            <SkeletonBlock className="dashboard-legend-swatch" />
            <SkeletonBlock className="dashboard-legend-label" />
          </span>
          <span>
            <SkeletonBlock className="dashboard-legend-swatch" />
            <SkeletonBlock className="dashboard-legend-label" />
          </span>
        </div>
        <div className="dashboard-chart-plot">
          <div className="dashboard-chart-y-axis">
            {Array.from({ length: 5 }, (_, label) => (
              <SkeletonBlock className="dashboard-chart-y-label" key={label} />
            ))}
          </div>
          <div className="dashboard-chart-graph">
            <div className="dashboard-chart-guides">
              {[0, 1, 2, 3, 4].map((line) => (
                <span key={line} />
              ))}
            </div>
            <svg className="dashboard-chart-lines" viewBox="0 0 600 170" preserveAspectRatio="none">
              <polyline points="0,145 60,125 120,132 180,102 240,115 300,56 360,98 420,48 480,86 540,59 600,22" />
              <polyline points="0,164 60,164 120,141 180,164 240,142 300,164 360,125 420,164 480,144 540,164 600,143" />
            </svg>
            <div className="dashboard-chart-x-axis">
              {Array.from({ length: 5 }, (_, label) => (
                <SkeletonBlock className="dashboard-chart-x-label" key={label} />
              ))}
            </div>
          </div>
        </div>
        <div className="chart-footer">
          <SkeletonBlock className="dashboard-chart-footer" />
        </div>
      </section>
      <section className="panel severity-panel dashboard-severity-placeholder" aria-hidden="true">
        <div className="panel-heading">
          <div className="dashboard-chart-placeholder-heading">
            <SkeletonBlock className="dashboard-panel-title" />
            <SkeletonBlock className="dashboard-panel-description" />
          </div>
        </div>
        <div className="severity-bars">
          <SkeletonBlock className="dashboard-severity-total" />
          {Array.from({ length: 5 }, (_, row) => (
            <div className="severity-bar-row" key={row}>
              <span className="severity-bar-label">
                <SkeletonBlock className="dashboard-severity-dot" />
                <SkeletonBlock className="dashboard-severity-label" />
              </span>
              <span className="severity-bar-track">
                <SkeletonBlock className="dashboard-severity-fill" />
              </span>
              <SkeletonBlock className="dashboard-severity-count" />
            </div>
          ))}
        </div>
        <div className="dashboard-severity-footer">
          <SkeletonBlock />
        </div>
      </section>
    </div>
  )
}

export function DashboardRecentScansSkeleton() {
  return (
    <section
      className="panel recent-scans dashboard-region-skeleton"
      data-testid="dashboard-recent-skeleton"
      role="status"
      aria-label="Loading recent scans"
      aria-busy="true"
    >
      <div className="panel-heading" aria-hidden="true">
        <div className="dashboard-chart-placeholder-heading">
          <SkeletonBlock className="dashboard-panel-title" />
          <SkeletonBlock className="dashboard-panel-description" />
        </div>
        <SkeletonBlock className="dashboard-recent-link" />
      </div>
      <div aria-hidden="true">
        <div className="table-scroll">
          <table className="data-table skeleton-table dashboard-scan-skeleton">
            <thead>
              <tr>
                {Array.from({ length: 5 }, (_, column) => (
                  <th key={column}>
                    <SkeletonBlock className="dashboard-scan-heading" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }, (_, row) => (
                <tr key={row}>
                  <td>
                    <SkeletonBlock className="dashboard-scan-target" />
                    <SkeletonBlock className="dashboard-scan-host" />
                  </td>
                  <td>
                    <SkeletonBlock className="dashboard-scan-status" />
                  </td>
                  <td>
                    <SkeletonBlock className="dashboard-scan-findings" />
                  </td>
                  <td>
                    <SkeletonBlock className="dashboard-scan-started" />
                  </td>
                  <td>
                    <SkeletonBlock className="dashboard-scan-duration" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export function DashboardActivitySkeleton() {
  return (
    <section
      className="panel dashboard-activity-skeleton"
      data-testid="dashboard-activity-skeleton"
      role="status"
      aria-label="Loading workspace activity"
      aria-busy="true"
    >
      <div className="panel-heading" aria-hidden="true">
        <SkeletonBlock className="dashboard-panel-title" />
      </div>
      <div aria-hidden="true">
        {Array.from({ length: 8 }, (_, row) => (
          <div className="activity-item dashboard-activity-placeholder" key={row}>
            <div className="dashboard-activity-copy">
              <SkeletonBlock className="dashboard-activity-title" />
              <SkeletonBlock className="dashboard-activity-detail" />
            </div>
            <SkeletonBlock className="dashboard-activity-time" />
          </div>
        ))}
      </div>
    </section>
  )
}
