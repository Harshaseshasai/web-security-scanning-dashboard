import { useState } from 'react'
import { useDeleteTarget } from '../hooks/use-target-mutations'
import { LockKeyhole, Pencil, Plus, ScanLine, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EnvironmentBadge } from '../components/ui/Badges'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/DataState'
import { Modal } from '../components/ui/Modal'
import { Reveal } from '../components/ui/Reveal'
import { IconHint } from '../components/ui/Tooltip'
import { useTargets, useFindings } from '../hooks/use-data'
import { useUiStore } from '../store/ui.store'
import { hostname, relativeTime } from '../lib/utils'
import { CONTENT } from '../config/content'
import type { Target } from '../types'

/** Manages the authorized target register, filtering, and reversible deletion. */
export default function TargetsPage() {
  const query = useTargets()
  const findings = useFindings()
  const [search, setSearch] = useState('')
  const [environment, setEnvironment] = useState('all')
  const [deleting, setDeleting] = useState<Target | null>(null)
  const openModal = useUiStore((state) => state.openModal)
  const remove = useDeleteTarget()

  /** Deletes the selected target once; the mutation rolls back if the request fails. */
  const confirmRemoval = () => {
    if (deleting === null || remove.isPending) return
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(CONTENT.targets.form.removed)
        setDeleting(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }
  const filtered =
    query.data?.filter(
      (target) =>
        `${target.name} ${target.url}`.toLowerCase().includes(search.toLowerCase()) &&
        (environment === 'all' || environment === target.environment)
    ) ?? []
  return (
    <>
      <PageHeader
        title={CONTENT.targets.title}
        description={CONTENT.targets.description}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              openModal('target')
            }}
          >
            <Plus size={14} aria-hidden="true" />
            {CONTENT.targets.add}
          </Button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={14} />
          <label className="sr-only" htmlFor="target-search">
            {CONTENT.targets.searchLabel}
          </label>
          <input
            id="target-search"
            placeholder={CONTENT.targets.searchPlaceholder}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
          />
        </div>
        <label htmlFor="environment-filter" className="sr-only">
          {CONTENT.targets.environmentLabel}
        </label>
        <select
          className="filter-button"
          id="environment-filter"
          value={environment}
          onChange={(event) => {
            setEnvironment(event.target.value)
          }}
        >
          <option value="all">{CONTENT.targets.allEnvironments}</option>
          {Object.entries(CONTENT.environments).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="table-summary">
          {filtered.length} {CONTENT.targets.summary}
        </span>
      </div>
      <Reveal className="panel">
        {query.isLoading ? (
          <TableSkeleton rows={6} />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : !filtered.length ? (
          <EmptyState
            title={search ? CONTENT.targets.noMatchTitle : CONTENT.targets.emptyTitle}
            description={CONTENT.targets.emptyDescription}
            action={
              search || environment !== 'all' ? CONTENT.targets.clearFilters : CONTENT.targets.add
            }
            onAction={() => {
              if (search || environment !== 'all') {
                setSearch('')
                setEnvironment('all')
              } else openModal('target')
            }}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.values(CONTENT.targets.columns).map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((target) => (
                  <tr key={target.id}>
                    <td>
                      <div className="target-cell">
                        <div className="cell-title">
                          {target.name}
                          <span className="cell-subtitle">{hostname(target.url)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <EnvironmentBadge environment={target.environment} />
                    </td>
                    <td>
                      <span
                        className="muted"
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        {target.authenticated ? (
                          <>
                            <LockKeyhole size={12} aria-hidden="true" />
                            {CONTENT.common.authenticated}
                          </>
                        ) : (
                          CONTENT.common.publicAccess
                        )}
                      </span>
                    </td>
                    <td className="muted">{relativeTime(target.lastScannedAt)}</td>
                    <td className="mono">
                      {findings.data?.filter(
                        (finding) =>
                          finding.targetId === target.id &&
                          ['open', 'confirmed'].includes(finding.status)
                      ).length ?? target.openFindings}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          small
                          disabled={target.id.startsWith('pending_')}
                          onClick={() => {
                            openModal('scan', target.id)
                          }}
                        >
                          <ScanLine size={12} aria-hidden="true" />
                          {CONTENT.targets.scan}
                        </Button>
                        <IconHint label={`${CONTENT.targets.editTarget}: ${target.name}`}>
                          <button
                            className="icon-button"
                            aria-label={`${CONTENT.targets.editTarget} ${target.name}`}
                            disabled={target.id.startsWith('pending_')}
                            onClick={() => {
                              openModal('target', target.id)
                            }}
                          >
                            <Pencil size={13} aria-hidden="true" />
                          </button>
                        </IconHint>
                        <IconHint label={`${CONTENT.targets.deleteTarget}: ${target.name}`}>
                          <button
                            className="icon-button"
                            aria-label={`${CONTENT.targets.deleteTarget} ${target.name}`}
                            disabled={target.id.startsWith('pending_')}
                            onClick={() => {
                              setDeleting(target)
                            }}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </IconHint>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Reveal>
      <Modal
        open={deleting !== null}
        onClose={() => {
          if (!remove.isPending) setDeleting(null)
        }}
        title={`${CONTENT.targets.remove} ${deleting?.name ?? ''}`.trim()}
        description={CONTENT.targets.removeDescription}
      >
        {remove.isError && (
          <div className="inline-error" role="alert">
            {remove.error.message}
          </div>
        )}
        <div className="modal-footer">
          <Button
            onClick={() => {
              setDeleting(null)
            }}
            disabled={remove.isPending}
          >
            {CONTENT.common.cancel}
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={confirmRemoval}>
            {CONTENT.targets.removeConfirm}
          </Button>
        </div>
      </Modal>
    </>
  )
}
