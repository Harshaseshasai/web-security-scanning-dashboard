import { z } from 'zod'

export const ScanStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'])
export const ScanSchema = z
  .object({
    id: z.string().min(1),
    targetId: z.string().min(1),
    status: ScanStatusSchema,
    progress: z.number().int().min(0).max(100),
    startedAt: z.iso.datetime({ offset: true }),
    durationSec: z.number().int().min(0).nullable(),
    findingsCount: z
      .object({
        critical: z.number().int().min(0),
        high: z.number().int().min(0),
        medium: z.number().int().min(0),
        low: z.number().int().min(0),
      })
      .strict(),
  })
  .strict()
export const CreateScanSchema = z
  .object({
    targetId: z.string().min(1, 'Choose a target'),
    profile: z.enum(['full', 'quick', 'api']),
  })
  .strict()

export type Scan = z.infer<typeof ScanSchema>
export type CreateScan = z.infer<typeof CreateScanSchema>
