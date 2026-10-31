import { describe, it, expect } from 'vitest'
import { FindingSchema, FindingStatusSchema, SeveritySchema } from '../schemas/finding.schema'
import { CreateTargetSchema, TargetSchema } from '../schemas/target.schema'
import { ScanSchema } from '../schemas/scan.schema'
import { LoginSchema } from '../schemas/auth.schema'
import { ReportSchema } from '../schemas/report.schema'
import { findings } from '../mocks/data/findings'
import { targets } from '../mocks/data/targets'
import { scans } from '../mocks/data/scans'
import { reports } from '../mocks/data/reports'

describe('Strict schema contracts', () => {
  it('uses OWASP Top 10 categories and weakness-specific HTTP evidence', () => {
    expect(findings.every((finding) => /^A(0[1-9]|10): /.test(finding.category))).toBe(true)
    expect(new Set(findings.map((finding) => finding.category)).size).toBeGreaterThanOrEqual(6)
    expect(findings[0].evidence.request).toContain('q=test%27')
    expect(findings[0].evidence.response).toContain('500 Internal Server Error')
  })
  it('keeps findings, completed scans, targets, and reports relationally consistent', () => {
    findings.forEach((finding) => {
      const scan = scans.find((item) => item.id === finding.scanId)
      expect(scan?.targetId).toBe(finding.targetId)
      expect(scan?.status).toBe('completed')
    })
    reports.forEach((report) => {
      const scan = scans.find((item) => item.id === report.scanId)
      expect(scan?.targetId).toBe(report.targetId)
      expect(scan?.status).toBe('completed')
    })
  })
  it('parses every mock finding, target, scan, and report', () => {
    findings.forEach((value) => {
      expect(FindingSchema.parse(value)).toEqual(value)
    })
    targets.forEach((value) => {
      expect(TargetSchema.parse(value)).toEqual(value)
    })
    scans.forEach((value) => {
      expect(ScanSchema.parse(value)).toEqual(value)
    })
    reports.forEach((value) => {
      expect(ReportSchema.parse(value)).toEqual(value)
    })
  })
  it.each(SeveritySchema.options)('accepts severity %s', (severity) => {
    expect(FindingSchema.safeParse({ ...findings[0], severity }).success).toBe(true)
  })
  it.each(FindingStatusSchema.options)('accepts status %s', (status) => {
    expect(FindingSchema.safeParse({ ...findings[0], status }).success).toBe(true)
  })
  it.each([
    { severity: 'extreme' },
    { cwe: 'CWE89' },
    { title: '' },
    { discoveredAt: 'yesterday' },
    { evidence: { request: '', response: 'OK' } },
    { id: undefined },
    { title: 'x'.repeat(201) },
    { unexpected: true },
  ])('rejects invalid finding %j', (change) => {
    expect(FindingSchema.safeParse({ ...findings[0], ...change }).success).toBe(false)
  })
  it('exposes the correct invalid severity path', () => {
    const result = FindingSchema.safeParse({ ...findings[0], severity: 'extreme' })
    if (!result.success) expect(result.error.issues[0].path).toEqual(['severity'])
  })
  it('accepts a 200-character title', () => {
    expect(FindingSchema.safeParse({ ...findings[0], title: 'a'.repeat(200) }).success).toBe(true)
  })
  it.each(['CWE-1', 'CWE-89', 'CWE-79', 'CWE-352'])('accepts valid CWE %s', (cwe) => {
    expect(FindingSchema.safeParse({ ...findings[0], cwe }).success).toBe(true)
  })
  it('accepts null lastScannedAt', () => {
    expect(TargetSchema.parse({ ...targets[0], lastScannedAt: null }).lastScannedAt).toBeNull()
  })
  it.each([-1, 101, 45.5])('rejects invalid progress %d', (progress) => {
    expect(ScanSchema.safeParse({ ...scans[0], progress }).success).toBe(false)
  })
  it('rejects unsupported protocols', () => {
    expect(TargetSchema.safeParse({ ...targets[0], url: 'ftp://example.com' }).success).toBe(false)
  })
})
describe('CreateTargetSchema credential refinement', () => {
  const valid = {
    name: 'Website',
    url: 'https://example.com',
    environment: 'production',
    authenticated: false,
  }
  it('accepts an unauthenticated target without credentials', () => {
    expect(CreateTargetSchema.safeParse(valid).success).toBe(true)
  })
  it('accepts an authenticated target with credentials', () => {
    expect(
      CreateTargetSchema.safeParse({
        ...valid,
        authenticated: true,
        username: 'user',
        password: 'secret',
      }).success
    ).toBe(true)
  })
  it('rejects a missing password', () => {
    const result = CreateTargetSchema.safeParse({ ...valid, authenticated: true, username: 'user' })
    if (!result.success) expect(result.error.issues[0].path).toEqual(['password'])
  })
  it('returns two issues for missing credentials', () => {
    const result = CreateTargetSchema.safeParse({ ...valid, authenticated: true })
    if (!result.success) expect(result.error.issues).toHaveLength(2)
  })
  it('rejects a whitespace username', () => {
    expect(
      CreateTargetSchema.safeParse({
        ...valid,
        authenticated: true,
        username: ' ',
        password: 'secret',
      }).success
    ).toBe(false)
  })
  it('permits unused optional credentials for public targets', () => {
    expect(
      CreateTargetSchema.safeParse({ ...valid, username: 'user', password: 'secret' }).success
    ).toBe(true)
  })
  it.each(['not-a-url', '', 'javascript:alert(1)'])('rejects invalid target URL %s', (url) => {
    expect(CreateTargetSchema.safeParse({ ...valid, url }).success).toBe(false)
  })
})
describe('LoginSchema', () => {
  it('accepts the demo credentials', () => {
    expect(
      LoginSchema.safeParse({ email: 'demo@example.com', password: 'password123' }).success
    ).toBe(true)
  })
  it('rejects a non-email address', () => {
    expect(LoginSchema.safeParse({ email: 'not-email', password: 'password123' }).success).toBe(
      false
    )
  })
  it('rejects a seven-character password', () => {
    expect(LoginSchema.safeParse({ email: 'demo@example.com', password: '1234567' }).success).toBe(
      false
    )
  })
})
