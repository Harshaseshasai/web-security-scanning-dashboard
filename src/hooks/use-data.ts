import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '../lib/api'
import { TargetSchema } from '../schemas/target.schema'
import { ScanSchema } from '../schemas/scan.schema'
import { FindingSchema } from '../schemas/finding.schema'
import { ReportSchema } from '../schemas/report.schema'
import { useFindingStore } from '../store/findings-filter.store'
import { FindingQueryResponseSchema } from '../schemas/finding.schema'
import type { Filters } from '../types'

/** Caches and validates the authorized target register. */
export const useTargets = () =>
  useQuery({
    queryKey: ['targets'],
    /** Passes query cancellation into the target API boundary. */
    queryFn: ({ signal }) => api('/targets', z.array(TargetSchema), { signal }),
  })
/** Polls validated scans only while at least one assessment remains active. */
export const useScans = () =>
  useQuery({
    queryKey: ['scans'],
    /** Passes query cancellation into the scan API boundary. */
    queryFn: ({ signal }) => api('/scans', z.array(ScanSchema), { signal }),
    /** Stops polling once all scan statuses are terminal. */
    refetchInterval: (query) =>
      query.state.data?.some((scan) => ['running', 'queued'].includes(scan.status)) ? 800 : false,
  })
/** Overlays session-only triage choices onto validated server findings. */
export function useFindings() {
  const overrides = useFindingStore((state) => state.overrides)
  const query = useQuery({
    queryKey: ['findings'],
    /** Parses the finding list before it enters the query cache. */
    queryFn: ({ signal }) => api('/findings', z.array(FindingSchema), { signal }),
  })
  return {
    ...query,
    data: query.data?.map((finding) => ({
      ...finding,
      status: overrides[finding.id] ?? finding.status,
    })),
  }
}
/**
 * Sends search, multi-filter, sort, and pagination to the mock API.
 * The response is strictly validated before the table receives a row.
 */
export function useFindingsQuery(filters: Filters) {
  const overrides = useFindingStore((state) => state.overrides)
  const params = new URLSearchParams()
  if (filters.search.length > 0) params.set('search', filters.search)
  if (filters.severity.length > 0) params.set('severity', filters.severity.join(','))
  if (filters.category.length > 0) params.set('category', filters.category.join(','))
  if (filters.status.length > 0) params.set('status', filters.status.join(','))
  if (filters.target.length > 0) params.set('target', filters.target)
  if (filters.scan.length > 0) params.set('scan', filters.scan)
  if (filters.sort.length > 0) params.set('sort', filters.sort)
  if (filters.direction !== 'none') params.set('direction', filters.direction)
  params.set('page', String(filters.page))
  params.set('pageSize', String(filters.pageSize))
  const query = useQuery({
    queryKey: ['findings', 'query', filters],
    queryFn: ({ signal }) =>
      api(`/findings/query?${params.toString()}`, FindingQueryResponseSchema, { signal }),
    placeholderData: (previous) => previous,
  })
  return {
    ...query,
    data:
      query.data === undefined
        ? undefined
        : {
            ...query.data,
            items: query.data.items.map((finding) => ({
              ...finding,
              status: overrides[finding.id] ?? finding.status,
            })),
          },
  }
}

/** Loads one finding and applies any local status override. */
export function useFinding(id: string) {
  const status = useFindingStore((state) => state.overrides[id])
  const query = useQuery({
    queryKey: ['finding', id],
    /** Parses the requested finding before showing its evidence. */
    queryFn: ({ signal }) => api(`/findings/${id}`, FindingSchema, { signal }),
  })
  return {
    ...query,
    data: query.data ? { ...query.data, status: status ?? query.data.status } : undefined,
  }
}
/** Caches the validated reports available to download. */
export const useReports = () =>
  useQuery({
    queryKey: ['reports'],
    /** Parses reports before enabling download actions. */
    queryFn: ({ signal }) => api('/reports', z.array(ReportSchema), { signal }),
  })
