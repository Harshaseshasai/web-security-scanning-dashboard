import { BadgeCheck, Check, CircleDot, CircleOff, Clock3, LoaderCircle, X } from 'lucide-react'
import type { FindingStatus, Scan } from '@/types'
import type { Severity } from '@/types'
import { capitalize } from '@/lib/utils'
import {
  FINDING_STATUS_CONFIG,
  SCAN_STATUS_CONFIG,
  type StatusMark,
  type StatusTone,
} from '@/config/status.config'

/** Maps a configured status mark to a visible, shape-distinct icon. */
function StatusIcon({ mark, tone }: { mark: StatusMark; tone: StatusTone }) {
  if (mark === 'spinner') {
    return (
      <span className="status-mark">
        <LoaderCircle className="status-spinner" size={15} aria-hidden="true" />
      </span>
    )
  }
  if (mark === 'check') {
    return (
      <span className="status-mark status-disc status-disc-success">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  if (mark === 'cross') {
    return (
      <span className="status-mark status-disc status-disc-danger">
        <X size={11} strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  const icons = {
    clock: Clock3,
    dot: CircleDot,
    'badge-check': BadgeCheck,
    slash: CircleOff,
  } as const
  const Icon = icons[mark]
  return (
    <span className="status-mark">
      <Icon className={`status-glyph status-tone-${tone}`} size={15} aria-hidden="true" />
    </span>
  )
}

/** Exposes the same configured finding mark for compact filter tabs. */
export function FindingStatusMark({ status }: { status: FindingStatus }) {
  const config = FINDING_STATUS_CONFIG[status]
  return <StatusIcon mark={config.mark} tone={config.tone} />
}

/** Exposes the same configured scan mark for compact scan filters. */
export function ScanStatusMark({ status }: { status: Scan['status'] }) {
  const config = SCAN_STATUS_CONFIG[status]
  return <StatusIcon mark={config.mark} tone={config.tone} />
}

/** Renders an explicitly named scan state with a motion or filled state icon. */
export function ScanStatusBadge({ status }: { status: Scan['status'] }) {
  const config = SCAN_STATUS_CONFIG[status]
  return (
    <span
      className={`status-badge scan-status scan-status-${status}`}
      aria-label={`Scan status: ${config.label}. ${config.description}`}
    >
      <StatusIcon mark={config.mark} tone={config.tone} />
      <span>{config.label}</span>
    </span>
  )
}

/** Renders a finding workflow status with a unique icon and named state. */
export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const config = FINDING_STATUS_CONFIG[status]
  return (
    <span
      className={`status-badge finding-status finding-status-${status}`}
      aria-label={`Finding status: ${config.label}. ${config.description}`}
    >
      <StatusIcon mark={config.mark} tone={config.tone} />
      <span>{config.label}</span>
    </span>
  )
}

/** Backwards-compatible status switch for callers that already know the status family. */
export function StatusBadge({ status }: { status: string }) {
  const config =
    status in SCAN_STATUS_CONFIG
      ? SCAN_STATUS_CONFIG[status as keyof typeof SCAN_STATUS_CONFIG]
      : status in FINDING_STATUS_CONFIG
        ? FINDING_STATUS_CONFIG[status as keyof typeof FINDING_STATUS_CONFIG]
        : undefined
  return (
    <span className={`status-badge status-badge-${status}`}>
      <span className="status-mark" aria-hidden="true" />
      {config?.label ?? capitalize(status)}
    </span>
  )
}

/** Names severity in text and pairs it with a high-contrast category rail. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`severity-badge severity-${severity}`}
      aria-label={`Severity: ${capitalize(severity)}`}
    >
      <span className="severity-marker" aria-hidden="true" />
      {capitalize(severity)}
    </span>
  )
}

/** Labels an environment with a neutral marker and explicit text. */
export function EnvironmentBadge({ environment }: { environment: string }) {
  return (
    <span className={`environment-badge environment-${environment}`}>
      <span aria-hidden="true" />
      {capitalize(environment)}
    </span>
  )
}
