import type { Finding, Filters } from '../types'
import { SEVERITY_ORDER } from './constants'
import { FilterSchema } from '../schemas/finding.schema'

/** Normalizes query parameters into validated, shareable finding filters. */
export function readFilters(params: URLSearchParams): Filters {
  return FilterSchema.parse({
    search: params.get('search') ?? '',
    severity: params.get('severity')?.split(',').filter(Boolean) ?? [],
    category: params.get('category')?.split(',').filter(Boolean) ?? [],
    status: params.get('status')?.split(',').filter(Boolean) ?? [],
    target: params.get('target') ?? '',
    scan: params.get('scan') ?? '',
    sort: params.get('sort') ?? '',
    direction: ['asc', 'desc'].includes(params.get('direction') ?? '')
      ? params.get('direction')
      : 'none',
    page: Math.max(1, Number.parseInt(params.get('page') ?? '1') || 1),
    pageSize: 20,
  })
}

/** Intersects filter dimensions, sorts a copy, and slices the requested page. */
export function filterFindings(findings: Finding[], filters: Filters) {
  const search = filters.search.trim()
  const expression = search ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null
  const result = findings.filter(
    (finding) =>
      (!expression ||
        expression.test(
          `${finding.title} ${finding.description} ${finding.location} ${finding.cwe}`
        )) &&
      (!filters.severity.length || filters.severity.includes(finding.severity)) &&
      (!filters.category.length || filters.category.includes(finding.category)) &&
      (!filters.status.length || filters.status.includes(finding.status)) &&
      (!filters.target || filters.target === finding.targetId) &&
      (!filters.scan || filters.scan === finding.scanId)
  )
  if (filters.sort && filters.direction !== 'none') {
    const column = filters.sort
    result.sort((a, b) => {
      const left: unknown = a[column as keyof Finding]
      const right: unknown = b[column as keyof Finding]
      const diff =
        column === 'severity'
          ? SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
          : (typeof left === 'string' ? left : '').localeCompare(
              typeof right === 'string' ? right : ''
            )
      return filters.direction === 'asc' ? diff : -diff
    })
  }
  return {
    total: result.length,
    all: result,
    rows: result.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize),
  }
}
