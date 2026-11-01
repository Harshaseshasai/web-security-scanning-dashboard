import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Brand, BrandMark } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { LoginSchema } from '@/schemas/auth.schema'
import { useAuthConfig, useLogin } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth.store'
import { CONTENT } from '@/config/content'

/** Validates analyst credentials, then delegates authentication to the API-backed hook. */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const session = useAuthStore((state) => state.session)
  const navigate = useNavigate()
  const demo = useAuthConfig()
  const mutation = useLogin()

  if (session !== null) return <Navigate to="/dashboard" replace />

  /** Validates the current form values and starts one login mutation. */
  const submit = (values: { email: string; password: string }) => {
    if (mutation.isPending) return
    const parsed = LoginSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
      )
      return
    }
    setErrors({})
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        navigate('/dashboard', { replace: true })
      },
    })
  }

  /** Uses the API-provided demo credentials instead of embedding them in the login page. */
  const enterDemo = () => {
    if (demo.data === undefined) return
    setEmail(demo.data.demoEmail)
    setPassword(demo.data.demoPassword)
    submit({ email: demo.data.demoEmail, password: demo.data.demoPassword })
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <Brand />
        <div className="login-copy">
          <BrandMark />
          <h2>{CONTENT.auth.brandHeadline}</h2>
          <p>{CONTENT.auth.brandDescription}</p>
        </div>
        <footer>{CONTENT.auth.brandFooter}</footer>
      </section>
      <section className="login-form-panel">
        <form
          className="login-form"
          noValidate
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            submit({ email, password })
          }}
        >
          <h1>{CONTENT.auth.heading}</h1>
          <p>{CONTENT.auth.description}</p>
          <div className="field">
            <label htmlFor="email">{CONTENT.auth.emailLabel}</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder={CONTENT.auth.emailPlaceholder}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error">
                {errors.email}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="password">{CONTENT.auth.passwordLabel}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={CONTENT.auth.passwordPlaceholder}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span id="password-error" className="field-error">
                {errors.password}
              </span>
            )}
          </div>
          {mutation.isError && (
            <div className="inline-error" role="alert">
              {mutation.error.message}
            </div>
          )}
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {mutation.isPending ? CONTENT.auth.signingIn : CONTENT.auth.signIn}
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
          <div className="demo-credentials">
            <p>
              {CONTENT.auth.demoAccount}
              <br />
              {demo.data !== undefined && (
                <span className="mono">
                  {demo.data.demoEmail} / {demo.data.demoPassword}
                </span>
              )}
              {demo.isLoading && <span className="muted">{CONTENT.auth.loadingDemo}</span>}
              {demo.isError && (
                <span className="text-danger">{CONTENT.auth.credentialUnavailable}</span>
              )}
            </p>
            <Button
              type="button"
              onClick={enterDemo}
              disabled={mutation.isPending || demo.data === undefined}
            >
              <LockKeyhole size={13} aria-hidden="true" />
              {CONTENT.auth.enterDemo}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
