import { useState } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/DataState'
import { useReports } from '../hooks/use-data'
import { useUiStore } from '../store/ui.store'
import { dateLabel } from '../lib/utils'
import { CONTENT } from '../config/content'

/** Lists API-provided PDF reports and exposes the assessment's stubbed PDF action. */
export default function ReportsPage() {
  const reports = useReports()
  const [search, setSearch] = useState('')
  const openModal = useUiStore((state) => state.openModal)
  const filtered =
    reports.data?.filter((report) =>
      `${report.target} ${report.id} ${report.scanId}`.toLowerCase().includes(search.toLowerCase())
    ) ?? []

  return (
    <>
      <PageHeader
        title={CONTENT.reports.title}
        description={CONTENT.reports.description}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              openModal('report')
            }}
          >
            <Plus size={14} aria-hidden="true" />
            {CONTENT.reports.generate}
          </Button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={14} aria-hidden="true" />
          <label htmlFor="report-search" className="sr-only">
            {CONTENT.reports.searchLabel}
          </label>
          <input
            id="report-search"
            placeholder={CONTENT.reports.searchPlaceholder}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
          />
        </div>
        <span className="table-summary">
          {filtered.length} {CONTENT.reports.summary}
        </span>
      </div>
      <section className="panel">
        {reports.isLoading ? (
          <TableSkeleton rows={4} />
        ) : reports.isError ? (
          <ErrorState error={reports.error} retry={() => void reports.refetch()} />
        ) : !filtered.length ? (
          <EmptyState
            title={search ? CONTENT.reports.noMatchTitle : CONTENT.reports.emptyTitle}
            description={CONTENT.reports.emptyDescription}
            action={search ? CONTENT.reports.clearSearch : CONTENT.reports.generate}
            onAction={() => {
              if (search) setSearch('')
              else openModal('report')
            }}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.values(CONTENT.reports.columns).map((heading) => (
                    <th key={heading} scope="col">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="cell-title">
                        {report.id}
                        <span className="cell-subtitle">{report.scanId}</span>
                      </div>
                    </td>
                    <td>{report.target}</td>
                    <td className="mono">{report.findings}</td>
                    <td className="muted">{dateLabel(report.createdAt)}</td>
                    <td>
                      <Button
                        small
                        aria-label={`${CONTENT.reports.downloadPdf}: ${report.id}`}
                        onClick={() => {
                          toast.info(CONTENT.reports.pdfUnavailable)
                        }}
                      >
                        <Download size={12} aria-hidden="true" />
                        {CONTENT.reports.downloadPdf}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
