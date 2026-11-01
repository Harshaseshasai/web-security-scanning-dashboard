import { useEffect, useState } from 'react'
import { CheckCheck, Download, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { FilterMenu } from '@/components/ui/FilterMenu'
import { EmptyState } from '@/components/ui/DataState'
import { FindingsTable } from '@/components/features/findings/FindingsTable'
import { useFindingsQuery, useTargets } from '@/hooks/use-data'
import { useFindingsFilter } from '@/hooks/use-findings-filter'
import { filterFindings } from '@/lib/findings-filter'
import { SeveritySchema } from '@/schemas/finding.schema'
import { FINDING_STATUS_CONFIG } from '@/config/status.config'
import { FindingStatusMark } from '@/components/ui/Badges'
import { CONTENT } from '@/config/content'
import { useUiStore } from '@/store/ui.store'
import { useFindingStore } from '@/store/findings-filter.store'
import { downloadFile, findingsCsv } from '@/lib/download'
import { IconHint } from '@/components/ui/Tooltip'
import { Select } from '@/components/ui/Select'

/** Coordinates URL filters, finding data, bulk selection, and exports. */
export default function FindingsPage() {
  const { filters, setFilter, resetFilters, setSortState, setPage } = useFindingsFilter()
  const query = useFindingsQuery(filters)
  const registry = query.all
  const targets = useTargets()
  const [search, setSearch] = useState(filters.search)
  const selected = useUiStore((state) => state.selectedRows)
  const setSelected = useUiStore((state) => state.setSelectedRows)
  const openModal = useUiStore((state) => state.openModal)
  const setStatus = useFindingStore((state) => state.setStatus)
  useEffect(() => {
    setSearch(filters.search)
  }, [filters.search])
  useEffect(() => {
    if (search === filters.search) return
    const timer = setTimeout(() => {
      setFilter('search', search)
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [search, filters.search, setFilter])
  const filteredAll = filterFindings(registry ?? [], { ...filters, page: 1, pageSize: 100 })
  const total = query.data?.total ?? 0
  const rows = query.data?.items ?? []
  const hasFilters =
    filters.search ||
    filters.severity.length ||
    filters.status.length ||
    filters.category.length ||
    filters.target ||
    filters.scan
  /** Downloads either the selected findings or the full filtered result as CSV. */
  const exportRows = () => {
    const exportData = selected.length
      ? (registry ?? []).filter((finding) => selected.includes(finding.id))
      : filteredAll.all
    downloadFile('sentinel-findings.csv', findingsCsv(exportData), 'text/csv;charset=utf-8')
    toast.success(`Exported ${exportData.length} findings`)
  }

  /** Confirms only selected open findings, leaving other workflow statuses untouched. */
  const confirmSelection = () => {
    let count = 0
    registry
      ?.filter((finding) => selected.includes(finding.id))
      .forEach((finding) => {
        if (setStatus(finding.id, finding.status, 'confirmed')) count++
      })
    setSelected([])
    toast.success(`${count} open findings confirmed`)
  }
  const confirmableCount =
    registry?.filter((finding) => selected.includes(finding.id) && finding.status === 'open')
      .length ?? 0
  return (
    <>
      <PageHeader
        title={CONTENT.findings.title}
        description={CONTENT.findings.description}
        actions={
          <Button onClick={exportRows} disabled={total === 0}>
            <Download size={14} aria-hidden="true" />
            {CONTENT.findings.export}
          </Button>
        }
      />
      <div className="tabs-row">
        <div className="tabs tabs-findings">
          <button
            className={`tab ${!filters.status.length ? 'active' : ''}`}
            onClick={() => {
              setFilter('status', [])
            }}
          >
            {CONTENT.findings.all}
            <span className="tab-counter">{registry?.length ?? 0}</span>
          </button>
          {Object.entries(FINDING_STATUS_CONFIG).map(([value, config]) => (
            <button
              key={value}
              className={`tab ${filters.status.length === 1 && filters.status[0] === value ? 'active' : ''}`}
              onClick={() => {
                setFilter('status', [value])
              }}
            >
              <FindingStatusMark status={value as keyof typeof FINDING_STATUS_CONFIG} />
              {config.label}
              <span className="tab-counter">
                {registry?.filter((finding) => finding.status === value).length ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search size={14} />
          <label htmlFor="findings-search" className="sr-only">
            {CONTENT.findings.searchLabel}
          </label>
          <input
            id="findings-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            placeholder={CONTENT.findings.searchPlaceholder}
          />
          {search && (
            <IconHint label="Clear search">
              <button
                className="icon-button"
                aria-label={CONTENT.findings.clearSearch}
                onClick={() => {
                  setSearch('')
                }}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </IconHint>
          )}
        </div>
        <FilterMenu
          label="Severity"
          options={SeveritySchema.options.map((value) => ({ value }))}
          selected={filters.severity}
          onChange={(values) => {
            setFilter('severity', values)
          }}
        />
        <FilterMenu
          label="Category"
          options={[...new Set(registry?.map((finding) => finding.category))]
            .sort()
            .map((value) => ({ value, label: value }))}
          selected={filters.category}
          onChange={(values) => {
            setFilter('category', values)
          }}
        />
        <FilterMenu
          label="Status"
          options={Object.entries(FINDING_STATUS_CONFIG).map(([value, config]) => ({
            value,
            label: config.label,
          }))}
          selected={filters.status}
          onChange={(values) => {
            setFilter('status', values)
          }}
        />
        <Select
          id="findings-target"
          label={CONTENT.findings.filterTargetLabel}
          placeholder={CONTENT.findings.allTargets}
          options={[
            { value: '', label: CONTENT.findings.allTargets },
            ...(targets.data?.map((target) => ({ value: target.id, label: target.name })) ?? []),
          ]}
          value={filters.target}
          onChange={(value) => {
            setFilter('target', value)
          }}
        />
        {Boolean(hasFilters) && (
          <Button
            variant="ghost"
            small
            onClick={() => {
              setSearch('')
              resetFilters()
            }}
          >
            <X size={12} />
            {CONTENT.findings.clear}
          </Button>
        )}
        <span className="table-summary">
          {total} {CONTENT.findings.results}
        </span>
      </div>
      {filters.scan && (
        <div className="form-notice" style={{ marginBottom: 15 }}>
          {CONTENT.findings.showingScan} <span className="mono">{filters.scan}</span>
          <IconHint label="Clear scan filter">
            <button
              onClick={() => {
                setFilter('scan', '')
              }}
              aria-label={CONTENT.findings.clearScanFilter}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </IconHint>
        </div>
      )}
      <section className="panel">
        {selected.length > 0 && (
          <div className="selected-toolbar">
            <span>
              {selected.length} {CONTENT.findings.selected}
            </span>
            <Button small onClick={confirmSelection} disabled={confirmableCount === 0}>
              <CheckCheck size={12} />
              {CONTENT.findings.confirmSelection}
            </Button>
            <Button small onClick={exportRows}>
              <Download size={12} />
              {CONTENT.findings.exportSelection}
            </Button>
            <IconHint label="Clear selection">
              <button
                className="icon-button"
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  setSelected([])
                }}
                aria-label={CONTENT.findings.clearSelection}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </IconHint>
          </div>
        )}
        {!query.isLoading && !query.isError && registry?.length === 0 ? (
          <EmptyState
            title={CONTENT.findings.emptyTitle}
            description={CONTENT.findings.emptyDescription}
            action={CONTENT.findings.emptyAction}
            onAction={() => {
              openModal('scan')
            }}
          />
        ) : (
          <FindingsTable
            findings={rows}
            targets={targets.data}
            total={total}
            filters={filters}
            onSort={setSortState}
            onPage={setPage}
            onReset={() => {
              setSearch('')
              resetFilters()
            }}
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
            selected={selected}
            onSelect={setSelected}
          />
        )}
      </section>
    </>
  )
}
