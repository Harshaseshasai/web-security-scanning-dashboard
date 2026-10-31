import { z } from 'zod'

/** Credentials accepted by the mock login endpoint. */
export const LoginSchema = z
  .object({
    email: z.email({ message: 'Enter a valid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  })
  .strict()

/** The authenticated person is returned by the mock API, never hardcoded by the shell. */
export const UserSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    email: z.email(),
    role: z.string().min(1),
  })
  .strict()

/** A workspace is resolved from its UUID through GET /api/workspaces/:id. */
export const WorkspaceSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    plan: z.string().min(1),
  })
  .strict()

/** Session data stored only after the login endpoint validates credentials. */
export const SessionSchema = z
  .object({
    token: z.string().min(1),
    user: UserSchema,
    workspaceId: z.uuid(),
  })
  .strict()

/** Public login-page hints supplied by the mock backend. */
export const AuthConfigSchema = z
  .object({
    demoEmail: z.email(),
    demoPassword: z.string().min(8),
  })
  .strict()

export const ErrorSchema = z.object({ error: z.string() }).strict()
export const SuccessSchema = z.object({ success: z.boolean() }).strict()

export type Login = z.infer<typeof LoginSchema>
export type User = z.infer<typeof UserSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
export type Session = z.infer<typeof SessionSchema>
export type AuthConfig = z.infer<typeof AuthConfigSchema>
