import { useRef, useState, type FormEvent } from 'react'
import { FileCheck2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useScans, useTargets } from '@/hooks/use-data'
import { useGenerateReport } from '@/hooks/use-report-mutations'
import { CreateReportSchema } from '@/schemas/report.schema'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/DataState'
import { useUiStore } from '@/store/ui.store'
import { CONTENT } from '@/config/content'
import { Select } from '@/components/ui/Select'

/** Requires a completed scan and delegates idempotent PDF generation to its hook. */
export function ReportForm({ onClose }: { onClose: () => void }) {
  const scans = useScans()
  const targets = useTargets()
  const [error, setError] = useState('')
  const [scanId, setScanId] = useState('')
  const lastSubmit = useRef(0)
  const lock = useRef(false)
  const navigate = useNavigate()
  const openModal = useUiStore((state) => state.openModal)
  const mutation = useGenerateReport()

  /** Validates the selected scan and prevents accidental duplicate generation. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current || mutation.isPending || Date.now() - lastSubmit.current < 500) return
    const result = CreateReportSchema.safeParse({ scanId })
    if (!result.success) {
      setError(CONTENT.reports.selectError)
      return
    }
    setError('')
    lock.current = true
    lastSubmit.current = Date.now()
    mutation.mutate(result.data, {
      onSuccess: () => {
        toast.success(CONTENT.reports.generated)
        onClose()
        navigate('/reports')
      },
      onError: (failure) => toast.error(failure.message),
      onSettled: () => {
        lock.current = false
      },
    })
  }

  if (scans.isLoading || targets.isLoading) return <TableSkeleton rows={3} columns={2} />
  if (scans.isError || targets.isError)
    return (
      <ErrorState
        error={scans.error ?? targets.error}
        retry={() => {
          void scans.refetch()
          void targets.refetch()
        }}
      />
    )
  const completed = scans.data?.filter((scan) => scan.status === 'completed') ?? []
  if (!completed.length)
    return (
      <EmptyState
        title={CONTENT.reports.form.noScanTitle}
        description={CONTENT.reports.form.noScanDescription}
        action={CONTENT.reports.form.newScan}
        onAction={() => {
          openModal('scan')
        }}
      />
    )
  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="report-scan">{CONTENT.reports.form.scan}</label>
        <Select
          id="report-scan"
          label={CONTENT.reports.form.scan}
          placeholder={CONTENT.reports.form.scan}
          options={completed.map((scan) => ({
            value: scan.id,
            label: `${targets.data?.find((target) => target.id === scan.targetId)?.name ?? 'Archived target'} / ${scan.id}`,
          }))}
          value={scanId}
          onChange={setScanId}
        />
      </div>
      <div className="form-notice">
        <FileCheck2 size={15} aria-hidden="true" />
        <span>{CONTENT.reports.notice}</span>
      </div>
      {(error || mutation.isError) && (
        <div className="inline-error" role="alert" aria-live="polite">
          {error || mutation.error?.message}
        </div>
      )}
      <div className="modal-footer">
        <Button type="button" onClick={onClose} disabled={mutation.isPending}>
          {CONTENT.reports.form.cancel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={mutation.isPending}
          aria-label={
            mutation.isPending
              ? CONTENT.reports.form.generating
              : mutation.isError
                ? CONTENT.reports.form.retry
                : CONTENT.reports.form.create
          }
        >
          {mutation.isPending
            ? CONTENT.reports.form.generating
            : mutation.isError
              ? CONTENT.reports.form.retry
              : CONTENT.reports.form.create}
        </Button>
      </div>
    </form>
  )
}
