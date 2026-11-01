import { z } from 'zod'

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info'])
export const FindingStatusSchema = z.enum(['open', 'confirmed', 'resolved', 'false_positive'])
export const FindingSchema = z
  .object({
    id: z.string().min(1),
    scanId: z.string().min(1),
    targetId: z.string().min(1),
    title: z.string().min(1).max(200),
    severity: SeveritySchema,
    category: z.string().min(1),
    cwe: z.string().regex(/^CWE-\d+$/, 'Must be in format CWE-NNN'),
    status: FindingStatusSchema,
    location: z.string().min(1),
    description: z.string().min(1),
    evidence: z.object({ request: z.string().min(1), response: z.string().min(1) }).strict(),
    remediation: z.string().min(1),
    discoveredAt: z.iso.datetime({ offset: true }),
  })
  .strict()
export const FilterSchema = z
  .object({
    search: z.string().default(''),
    severity: z.array(z.string()).default([]),
    category: z.array(z.string()).default([]),
    status: z.array(z.string()).default([]),
    target: z.string().default(''),
    scan: z.string().default(''),
    sort: z.string().default(''),
    direction: z.enum(['asc', 'desc', 'none']).default('none'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  })
  .strict()

export type Finding = z.infer<typeof FindingSchema>
export type Severity = z.infer<typeof SeveritySchema>
export type FindingStatus = z.infer<typeof FindingStatusSchema>
export type Filters = z.infer<typeof FilterSchema>
