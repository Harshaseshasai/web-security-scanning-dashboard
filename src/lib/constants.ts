import type { FindingStatus, Severity } from '../types'

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}
export const TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  open: ['confirmed', 'false_positive'],
  confirmed: ['resolved', 'open'],
  resolved: ['open'],
  false_positive: ['open'],
}
export const DEMO_DATE = new Date('2026-10-31T10:30:00Z')
