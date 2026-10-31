/**
 * Static presentation metadata for every workflow state.
 * Labels, descriptions, icon selection, and tone live here so UI components never
 * own status copy or invent a second variant of the same status.
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'danger' | 'warning'
export type StatusMark =
  | 'spinner'
  | 'check'
  | 'cross'
  | 'clock'
  | 'dot'
  | 'badge-check'
  | 'slash'

export type StatusPresentation = {
  label: string
  description: string
  mark: StatusMark
  tone: StatusTone
}

export const SCAN_STATUS_CONFIG = {
  queued: {
    label: 'Queued',
    description: 'Waiting for an available scan worker',
    mark: 'clock',
    tone: 'neutral',
  },
  running: {
    label: 'Running',
    description: 'Assessment is in progress',
    mark: 'spinner',
    tone: 'info',
  },
  completed: {
    label: 'Completed',
    description: 'Assessment finished successfully',
    mark: 'check',
    tone: 'success',
  },
  failed: {
    label: 'Failed',
    description: 'Assessment stopped before completion',
    mark: 'cross',
    tone: 'danger',
  },
} as const satisfies Record<string, StatusPresentation>

export const FINDING_STATUS_CONFIG = {
  open: {
    label: 'Open',
    description: 'Needs analyst review',
    mark: 'dot',
    tone: 'warning',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Verified as a real weakness',
    mark: 'badge-check',
    tone: 'info',
  },
  resolved: {
    label: 'Resolved',
    description: 'Fix has been verified',
    mark: 'check',
    tone: 'success',
  },
  false_positive: {
    label: 'False positive',
    description: 'No security impact after review',
    mark: 'slash',
    tone: 'neutral',
  },
} as const satisfies Record<string, StatusPresentation>

export const SEVERITY_TONE = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'info',
} as const

/** Human-readable labels for values that are also used in URLs and API payloads. */
export const SCAN_STATUS_LABELS = Object.fromEntries(
  Object.entries(SCAN_STATUS_CONFIG).map(([value, config]) => [value, config.label])
) as Record<keyof typeof SCAN_STATUS_CONFIG, string>

export const FINDING_STATUS_LABELS = Object.fromEntries(
  Object.entries(FINDING_STATUS_CONFIG).map(([value, config]) => [value, config.label])
) as Record<keyof typeof FINDING_STATUS_CONFIG, string>
