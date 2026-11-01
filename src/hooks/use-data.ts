import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import { filterFindings } from '@/lib/findings-filter'
import { TargetSchema } from '@/schemas/target.schema'
import { ScanSchema } from '@/schemas/scan.schema'
import { FindingSchema } from '@/schemas/finding.schema'
import { ReportSchema } from '@/schemas/report.schema'
import { useFindingStore } from '@/store/findings-filter.store'
import type { Filters } from '@/types'

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
/** Applies shareable search, filters, sorting, and pagination to the contract findings list. */
export function useFindingsQuery(filters: Filters) {
  const query = useFindings()
  const result = query.data === undefined ? undefined : filterFindings(query.data, filters)
  return {
    ...query,
    all: query.data,
    data:
      result === undefined
        ? undefined
        : {
            items: result.rows,
            total: result.total,
            page: filters.page,
            pageSize: filters.pageSize,
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
