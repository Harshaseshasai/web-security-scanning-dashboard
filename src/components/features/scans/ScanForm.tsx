import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useScans, useTargets } from '../../../hooks/use-data'
import { useCreateScan } from '../../../hooks/use-scan-mutations'
import { CreateScanSchema } from '../../../schemas/scan.schema'
import { Button } from '../../ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../../ui/DataState'
import { useUiStore } from '../../../store/ui.store'
import { CONTENT } from '../../../config/content'

/** Requires authorization and delegates validated scan creation to its hook. */
export function ScanForm({ targetId, onClose }: { targetId: string; onClose: () => void }) {
  const targets = useTargets()
  const scans = useScans()
  const [error, setError] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const lock = useRef(false)
  const navigate = useNavigate()
  const openModal = useUiStore((state) => state.openModal)
  const mutation = useCreateScan()

  /** Prevents duplicate scan submissions and routes to live scan progress on success. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current || mutation.isPending) return
    const form = new FormData(event.currentTarget)
    const result = CreateScanSchema.safeParse({
      targetId: form.get('targetId'),
      profile: form.get('profile'),
    })
    if (!result.success) {
      setError(CONTENT.scans.targetError)
      return
    }
    if (!authorized) {
      setError(CONTENT.scans.authorizationError)
      return
    }
    setError('')
    lock.current = true
    mutation.mutate(result.data, {
      onSuccess: () => {
        toast.success(CONTENT.scans.queued)
        onClose()
        navigate('/scans')
      },
      onError: (failure) => toast.error(failure.message),
      onSettled: () => {
        lock.current = false
      },
    })
  }

  if (targets.isLoading) return <TableSkeleton rows={3} columns={2} />
  if (targets.isError)
    return <ErrorState error={targets.error} retry={() => void targets.refetch()} />
  if (targets.data === undefined || targets.data.length === 0)
    return (
      <EmptyState
        title={CONTENT.scans.form.addTargetTitle}
        description={CONTENT.scans.form.addTargetDescription}
        action={CONTENT.scans.form.addTarget}
        onAction={() => {
          openModal('target')
        }}
      />
    )
  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="scan-target">{CONTENT.scans.form.target}</label>
        <select id="scan-target" name="targetId" defaultValue={targetId}>
          <option value="" disabled>
            {CONTENT.scans.form.chooseTarget}
          </option>
          {targets.data.map((target) => {
            const busy = scans.data?.some(
              (scan) => scan.targetId === target.id && ['running', 'queued'].includes(scan.status)
            )
            return (
              <option key={target.id} value={target.id} disabled={busy}>
                {target.name}
                {busy === true ? ` ${CONTENT.scans.form.scanInProgress}` : ''}
              </option>
            )
          })}
        </select>
      </div>
      <div className="field">
        <label htmlFor="scan-profile">{CONTENT.scans.form.profile}</label>
        <select id="scan-profile" name="profile">
          <option value="full">{CONTENT.scans.form.full}</option>
          <option value="quick">{CONTENT.scans.form.quick}</option>
          <option value="api">{CONTENT.scans.form.api}</option>
        </select>
        <small>{CONTENT.scans.form.profileHelp}</small>
      </div>
      <div className="form-notice">
        <ShieldCheck size={15} aria-hidden="true" />
        <span>{CONTENT.scans.form.notice}</span>
      </div>
      <label className="check-label" htmlFor="scan-authorized">
        <input
          id="scan-authorized"
          type="checkbox"
          checked={authorized}
          onChange={(event) => {
            setAuthorized(event.target.checked)
          }}
        />
        {CONTENT.scans.form.authorization}
      </label>
      {(error || mutation.isError) && (
        <div className="inline-error" role="alert">
          {error || mutation.error?.message}
        </div>
      )}
      <div className="modal-footer">
        <Button type="button" onClick={onClose} disabled={mutation.isPending}>
          {CONTENT.scans.cancel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={mutation.isPending}
          aria-label={mutation.isPending ? CONTENT.scans.starting : CONTENT.scans.start}
        >
          {mutation.isPending ? CONTENT.scans.starting : CONTENT.scans.start}
        </Button>
      </div>
    </form>
  )
}
