import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateScanSchema, ScanSchema } from '@/schemas/scan.schema'
import { api } from '@/lib/api'
import type { CreateScan, Scan } from '@/types'

/** Creates an authorized scan, then publishes the returned scan before navigation. */
export function useCreateScan() {
  const key = useRef(crypto.randomUUID())
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateScan) => {
      const validated = CreateScanSchema.parse(body)
      return api('/scans', ScanSchema, { method: 'POST', body: validated, key: key.current })
    },
    onSuccess: (created) => {
      client.setQueryData<Scan[]>(['scans'], (current = []) => [
        created,
        ...current.filter((scan) => scan.id !== created.id),
      ])
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['scans'] }),
  })
}
