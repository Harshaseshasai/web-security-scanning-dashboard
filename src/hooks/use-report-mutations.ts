import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateReportSchema, ReportSchema } from '@/schemas/report.schema'
import { api } from '@/lib/api'
import type { CreateReport, Report } from '@/types'

/** Generates a PDF report through the retryable report endpoint. */
export function useGenerateReport() {
  const key = useRef(crypto.randomUUID())
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateReport) => {
      const validated = CreateReportSchema.parse(body)
      return api('/reports/generate', ReportSchema, {
        method: 'POST',
        body: validated,
        key: key.current,
      })
    },
    onSuccess: (created) => {
      client.setQueryData<Report[]>(['reports'], (current = []) => [
        created,
        ...current.filter((report) => report.id !== created.id),
      ])
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['reports'] }),
  })
}
