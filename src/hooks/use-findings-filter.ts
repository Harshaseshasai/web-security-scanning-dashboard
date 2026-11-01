import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { readFilters } from '@/lib/findings-filter'

/** Derives shareable filter, sort, and page controls from URL parameters. */
export function useFindingsFilter() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  /** Writes one filter dimension to the URL and restarts pagination when its scope changes. */
  const setFilter = useCallback(
    (key: string, value: string | string[]) => {
      setParams((current) => {
        const next = new URLSearchParams(current)
        const text = Array.isArray(value) ? value.join(',') : value
        if (text) next.set(key, text)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      })
    },
    [setParams]
  )
  /** Cycles a column through ascending, descending, and unsorted URL states. */
  const setSortState = (column: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)
      const direction =
        filters.sort !== column || filters.direction === 'none'
          ? 'asc'
          : filters.direction === 'asc'
            ? 'desc'
            : 'none'
      if (direction === 'none') {
        next.delete('sort')
        next.delete('direction')
      } else {
        next.set('sort', column)
        next.set('direction', direction)
      }
      next.delete('page')
      return next
    })
  }
  /** Removes every search parameter to restore the complete finding register. */
  const resetFilters = () => {
    setParams({})
  }

  /** Updates just the page number without clearing the current filters. */
  const setPage = (page: number) => {
    setFilter('page', String(page))
  }

  return {
    filters,
    setFilter,
    resetFilters,
    sortState: { column: filters.sort, direction: filters.direction },
    setSortState,
    page: filters.page,
    setPage,
  }
}
