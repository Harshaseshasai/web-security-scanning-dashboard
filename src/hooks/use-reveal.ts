import { useEffect, useRef } from 'react'

/**
 * Toggles a one-shot reveal class when an element first enters the viewport.
 * Respects the browser's reduced-motion preference by doing nothing when the
 * media query is not available or the user opted out.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const element = ref.current
    if (element === null) return
    if (
      typeof IntersectionObserver === 'undefined' ||
      !window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    ) {
      element.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          element.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])
  return ref
}
