import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { useReveal } from '../../hooks/use-reveal'

type RevealProps = ComponentProps<'section'> & { children: ReactNode }

/**
 * Section that fades and rises once it scrolls into view.
 * Uses transform+opacity only so layout never shifts.
 */
export const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(
  { className, children, ...props }: RevealProps,
  forwardedRef
) {
  const localRef = useReveal<HTMLElement>()
  return (
    <section
      ref={(element) => {
        localRef.current = element
        if (typeof forwardedRef === 'function') forwardedRef(element)
        else if (forwardedRef !== null) forwardedRef.current = element
      }}
      className={className === undefined ? 'reveal' : `reveal ${className}`}
      {...props}
    >
      {children}
    </section>
  )
})
