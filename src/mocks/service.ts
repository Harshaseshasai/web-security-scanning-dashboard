import { z } from 'zod'
import { DEMO_DATE } from '../lib/constants'
import { CreateTargetSchema } from '../schemas/target.schema'
import { CreateScanSchema } from '../schemas/scan.schema'
import { CreateReportSchema } from '../schemas/report.schema'
import { LoginSchema } from '../schemas/auth.schema'
import { targets } from './data/targets'
import { scans } from './data/scans'
import { findings } from './data/findings'
import { reports } from './data/reports'
import {
  MOCK_AUTH_TOKEN,
  mockAuthConfig,
  mockUser,
  mockWorkspace,
  mockWorkspaceDirectory,
} from './identity'
import { delay, DELIBERATE_ERROR_PATH } from './utils'

let reportAttempts = 0
const idempotentResults = new Map<string, unknown>()
const scanClocks = new Map(
  scans
    .filter((scan) => scan.status === 'running' || scan.status === 'queued')
    .map((scan) => [scan.id, { start: Date.now(), progress: scan.progress }])
)
const json = (data: unknown, status = 200) => Response.json(data, { status })

/** Advances each active mock scan from its shared service clock. */
function updateProgress() {
  for (const scan of scans) {
    const clock = scanClocks.get(scan.id)
    if (!clock || !['running', 'queued'].includes(scan.status)) continue
    const elapsed = Math.floor((Date.now() - clock.start) / 800)
    if (scan.status === 'queued' && elapsed < 4) continue
    scan.status = 'running'
    scan.progress = Math.min(100, clock.progress + elapsed)
    if (scan.progress === 100) {
      scan.status = 'completed'
      scan.durationSec = Math.floor((Date.now() - clock.start) / 1000)
      const target = targets.find((item) => item.id === scan.targetId)
      if (target)
        target.lastScannedAt = new Date(Math.max(Date.now(), DEMO_DATE.getTime())).toISOString()
    }
  }
}

/** Validates and handles mock identity, query, and mutation endpoints with latency. */
export async function mockRequest(request: Request): Promise<Response> {
  await delay()
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method
  try {
    if (path === '/api/auth/config' && method === 'GET') return json(mockAuthConfig)
    if (path === '/api/login' && method === 'POST') {
      const credentials = LoginSchema.parse(await request.json())
      if (
        credentials.email !== mockAuthConfig.demoEmail ||
        credentials.password !== mockAuthConfig.demoPassword
      )
        return json({ error: 'Incorrect email or password. Please try again.' }, 401)
      return json({
        token: MOCK_AUTH_TOKEN,
        user: mockUser,
        workspaceId: mockWorkspace.id,
      })
    }

    if (request.headers.get('Authorization') !== `Bearer ${MOCK_AUTH_TOKEN}`)
      return json({ error: 'Your session has expired. Please sign in again.' }, 401)

    const key = `${path}:${request.headers.get('Idempotency-Key') ?? ''}`
    if (method === 'POST' && idempotentResults.has(key)) return json(idempotentResults.get(key))

    if (path === '/api/session' && method === 'GET')
      return json({ token: MOCK_AUTH_TOKEN, user: mockUser, workspaceId: mockWorkspace.id })
    if (path.startsWith('/api/workspaces/') && method === 'GET') {
      const workspace = mockWorkspaceDirectory.get(path.split('/').pop() ?? '')
      return workspace
        ? json(workspace)
        : json({ error: 'This workspace could not be found.' }, 404)
    }
    if (path === '/api/targets' && method === 'GET') return json(targets)
    if (path === '/api/scans' && method === 'GET') {
      updateProgress()
      return json(scans)
    }
    if (path === '/api/findings' && method === 'GET') return json(findings)
    if (path.startsWith('/api/findings/') && method === 'GET') {
      const finding = findings.find((item) => item.id === path.split('/').pop())
      return finding ? json(finding) : json({ error: 'This finding could not be found.' }, 404)
    }
    if (path === '/api/reports' && method === 'GET') return json(reports)
    if (
      (path === '/api/targets' && method === 'POST') ||
      (path.startsWith('/api/targets/') && method === 'PUT')
    ) {
      const parsedTarget = CreateTargetSchema.parse(await request.json())
      const body = {
        name: parsedTarget.name,
        url: parsedTarget.url,
        environment: parsedTarget.environment,
        authenticated: parsedTarget.authenticated,
      }
      const existing =
        method === 'PUT' ? targets.find((target) => target.id === path.split('/').pop()) : undefined
      if (method === 'PUT' && !existing)
        return json({ error: 'This target no longer exists.' }, 404)
      if (targets.some((target) => target.url === body.url && target.id !== existing?.id))
        return json({ error: 'A target with this URL already exists.' }, 409)
      const result = {
        ...body,
        id: existing?.id ?? `tgt_${crypto.randomUUID().slice(0, 8)}`,
        lastScannedAt: existing?.lastScannedAt ?? null,
        openFindings: existing?.openFindings ?? 0,
      }
      if (existing) Object.assign(existing, result)
      else targets.unshift(result)
      idempotentResults.set(key, result)
      return json(result, existing ? 200 : 201)
    }
    if (path.startsWith('/api/targets/') && method === 'DELETE') {
      const id = path.split('/').pop()
      const index = targets.findIndex((target) => target.id === id)
      if (index >= 0) targets.splice(index, 1)
      return json({ success: true })
    }
    if (path === '/api/scans' && method === 'POST') {
      const body = CreateScanSchema.parse(await request.json())
      if (!targets.some((target) => target.id === body.targetId))
        return json({ error: 'Choose an existing target.' }, 422)
      if (
        scans.some(
          (scan) => scan.targetId === body.targetId && ['running', 'queued'].includes(scan.status)
        )
      )
        return json({ error: 'This target already has an active scan.' }, 409)
      const scan = {
        id: `scan_${Date.now().toString().slice(-6)}`,
        targetId: body.targetId,
        status: 'queued' as const,
        progress: 0,
        startedAt: new Date(Math.max(Date.now(), DEMO_DATE.getTime())).toISOString(),
        durationSec: null,
        findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
      }
      scans.unshift(scan)
      scanClocks.set(scan.id, { start: Date.now(), progress: 0 })
      idempotentResults.set(key, scan)
      return json(scan, 201)
    }
    if (path === DELIBERATE_ERROR_PATH && method === 'POST') {
      const body = CreateReportSchema.parse(await request.json())
      const scan = scans.find((item) => item.id === body.scanId && item.status === 'completed')
      if (!scan) return json({ error: 'Reports can only be generated for completed scans.' }, 422)
      reportAttempts++
      if (reportAttempts === 1)
        return json({ error: 'Report service temporarily unavailable. Please retry.' }, 503)
      const report = {
        id: `rpt_${Date.now().toString().slice(-4)}`,
        scanId: scan.id,
        target: targets.find((target) => target.id === scan.targetId)?.name ?? scan.targetId,
        createdAt: new Date(Math.max(Date.now(), DEMO_DATE.getTime())).toISOString(),
        findings: findings.filter((finding) => finding.scanId === scan.id).length,
        format: 'pdf' as const,
      }
      reports.unshift(report)
      idempotentResults.set(key, report)
      return json(report, 201)
    }
    return json({ error: 'The requested resource was not found.' }, 404)
  } catch (error) {
    return json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join('. ')
            : 'The request could not be completed.',
      },
      400
    )
  }
}
