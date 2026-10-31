import { z } from 'zod'
import { useAuthStore } from '../store/auth.store'
import { ErrorSchema } from '../schemas/auth.schema'

let useDemoTransport = !import.meta.env.DEV && import.meta.env.VITE_LIVE_API !== 'true'
/** Falls back to the same mock contract when service workers are unavailable. */
export const enableDemoTransport = () => {
  useDemoTransport = true
}

/** Authenticates requests, handles HTTP errors, and parses successful payloads through Zod. */
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: { method?: string; body?: unknown; key?: string; signal?: AbortSignal } = {}
): Promise<T> {
  const token = useAuthStore.getState().session?.token
  const request = new Request(new URL(`/api${path}`, window.location.origin), {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.key !== undefined ? { 'Idempotency-Key': options.key } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })
  // Section 7.1/12: MSW stays development-only. A shared in-memory transport keeps the
  // static assessment preview functional; VITE_LIVE_API=true removes this fallback.
  const response = useDemoTransport
    ? await (await import('../mocks/service')).mockRequest(request)
    : await fetch(request)
  const json: unknown = await response.json()
  if (!response.ok) {
    const parsed = ErrorSchema.safeParse(json)
    throw new Error(
      parsed.success ? parsed.data.error : `API ${response.status}: ${response.statusText}`
    )
  }
  return schema.parse(json)
}
