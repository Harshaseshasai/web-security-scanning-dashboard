import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/** Shares pending, disabled, and visual states across form actions. */
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    loading?: boolean
    small?: boolean
  }
>(function Button(
  {
    className,
    variant = 'secondary',
    loading = false,
    small = false,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn('button', `button-${variant}`, small && 'button-small', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  )
})
