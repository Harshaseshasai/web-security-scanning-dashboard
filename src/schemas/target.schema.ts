import { z } from 'zod'

// Section 6: use the patched Zod 4 API while retaining the specified strict contract.
export const EnvironmentSchema = z.enum(['staging', 'production', 'dev'])
export const TargetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    url: z
      .url({ message: 'Must be a valid URL including https://' })
      .refine((value) => /^https?:\/\//.test(value), 'Only HTTP and HTTPS targets are supported'),
    environment: EnvironmentSchema,
    authenticated: z.boolean(),
    lastScannedAt: z.iso.datetime({ offset: true }).nullable(),
    openFindings: z.number().int().min(0),
  })
  .strict()

export const CreateTargetSchema = TargetSchema.omit({
  id: true,
  lastScannedAt: true,
  openFindings: true,
})
  .extend({
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.authenticated) {
      if ((data.username?.trim() ?? '') === '')
        ctx.addIssue({
          code: 'custom',
          message: 'Username required for authenticated scans',
          path: ['username'],
        })
      if ((data.password?.trim() ?? '') === '')
        ctx.addIssue({
          code: 'custom',
          message: 'Password required for authenticated scans',
          path: ['password'],
        })
    }
  })

export type Target = z.infer<typeof TargetSchema>
export type CreateTarget = z.infer<typeof CreateTargetSchema>
