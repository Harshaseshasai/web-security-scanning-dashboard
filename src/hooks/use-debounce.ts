import { useEffect, useState } from 'react'

/** Delays updates until an input stays unchanged for the requested interval. */
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delay)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])
  return debounced
}
