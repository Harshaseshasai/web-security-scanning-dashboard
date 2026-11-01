import { useRef, useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { CreateTargetSchema } from '@/schemas/target.schema'
import { useCreateTarget, useUpdateTarget } from '@/hooks/use-target-mutations'
import { Button } from '@/components/ui/Button'
import type { Target } from '@/types'
import { CONTENT } from '@/config/content'
import { Select } from '@/components/ui/Select'

/** Validates target ownership fields, then delegates cache-safe persistence to hooks. */
export function TargetForm({ target, onClose }: { target?: Target; onClose: () => void }) {
  const [authenticated, setAuthenticated] = useState(target?.authenticated ?? false)
  const [environment, setEnvironment] = useState<string>(target?.environment ?? 'production')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submitted = useRef(false)
  const createTarget = useCreateTarget()
  const updateTarget = useUpdateTarget(target)
  const mutation = target === undefined ? createTarget : updateTarget

  /** Validates the form once before invoking the appropriate target mutation hook. */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitted.current || mutation.isPending) return
    const values = new FormData(event.currentTarget)
    const parsed = CreateTargetSchema.safeParse({
      name: values.get('name'),
      url: values.get('url'),
      environment,
      authenticated,
      ...(authenticated
        ? { username: values.get('username'), password: values.get('password') }
        : {}),
    })
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
      )
      return
    }
    setErrors({})
    submitted.current = true
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(
          target === undefined ? CONTENT.targets.form.created : CONTENT.targets.form.updated
        )
        onClose()
      },
      onError: (error) => toast.error(error.message),
      onSettled: () => {
        submitted.current = false
      },
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="target-name">{CONTENT.targets.form.name}</label>
        <input
          name="name"
          id="target-name"
          defaultValue={target?.name}
          placeholder={CONTENT.targets.form.namePlaceholder}
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="target-url">{CONTENT.targets.form.url}</label>
        <input
          name="url"
          id="target-url"
          type="url"
          defaultValue={target?.url}
          placeholder={CONTENT.targets.form.urlPlaceholder}
          aria-invalid={Boolean(errors.url)}
        />
        {errors.url && <span className="field-error">{errors.url}</span>}
      </div>
      <div className="field">
        <label htmlFor="target-environment">{CONTENT.targets.form.environment}</label>
        <Select
          id="target-environment"
          label={CONTENT.targets.form.environment}
          placeholder={CONTENT.targets.form.environment}
          options={Object.entries(CONTENT.environments).map(([value, label]) => ({
            value,
            label,
          }))}
          value={environment}
          onChange={setEnvironment}
        />
      </div>
      <label className="check-label" htmlFor="target-authenticated">
        <input
          id="target-authenticated"
          type="checkbox"
          checked={authenticated}
          onChange={(event) => {
            setAuthenticated(event.target.checked)
          }}
        />
        {CONTENT.targets.form.authenticated}
      </label>
      {authenticated && (
        <div className="form-row">
          <div className="field">
            <label htmlFor="target-username">{CONTENT.targets.form.username}</label>
            <input
              id="target-username"
              name="username"
              autoComplete="off"
              placeholder={CONTENT.targets.form.usernamePlaceholder}
              aria-invalid={Boolean(errors.username)}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>
          <div className="field">
            <label htmlFor="target-password">{CONTENT.targets.form.password}</label>
            <input
              id="target-password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
        </div>
      )}
      <div className="form-notice">
        <ShieldCheck size={15} aria-hidden="true" />
        <span>{CONTENT.targets.form.authorization}</span>
      </div>
      {mutation.isError && (
        <div role="alert" className="inline-error">
          {mutation.error.message}
        </div>
      )}
      <div className="modal-footer">
        <Button type="button" onClick={onClose} disabled={mutation.isPending}>
          {CONTENT.targets.form.cancel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={mutation.isPending}
          aria-label={
            mutation.isPending
              ? CONTENT.targets.form.addingAria
              : target === undefined
                ? CONTENT.targets.form.create
                : CONTENT.targets.form.saveAria
          }
        >
          {mutation.isPending
            ? CONTENT.targets.form.saving
            : target === undefined
              ? CONTENT.targets.form.create
              : CONTENT.targets.form.save}
        </Button>
      </div>
    </form>
  )
}
