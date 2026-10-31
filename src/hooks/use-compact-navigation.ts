import { useEffect, useState } from 'react'

const compactWidth = '(min-width: 681px) and (max-width: 900px)'

/** Tracks the CSS breakpoint that hides sidebar labels even without a manual collapse. */
export function useCompactNavigation() {
  const [compact, setCompact] = useState(() => window.matchMedia(compactWidth).matches)

  useEffect(() => {
    const media = window.matchMedia(compactWidth)
    /** Updates tooltip eligibility when the sidebar crosses its icon-only breakpoint. */
    const update = () => {
      setCompact(media.matches)
    }
    media.addEventListener('change', update)
    update()
    return () => {
      media.removeEventListener('change', update)
    }
  }, [])

  return compact
}
