import { z } from 'zod'

/** GET /api/reports follows the assessment contract exactly. */
export const ReportSchema = z
  .object({
    id: z.string().min(1),
    scanId: z.string().min(1),
    target: z.string().min(1),
    createdAt: z.iso.datetime({ offset: true }),
    findings: z.number().int().min(0),
    format: z.literal('pdf'),
  })
  .strict()

/** The selected scan determines which completed assessment becomes a report. */
export const CreateReportSchema = z
  .object({
    scanId: z.string().min(1, 'Choose a completed scan'),
  })
  .strict()

export type Report = z.infer<typeof ReportSchema>
export type CreateReport = z.infer<typeof CreateReportSchema>
