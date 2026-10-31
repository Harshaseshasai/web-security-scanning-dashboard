import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEMO_DATE } from './constants'

/** Merges conditional class names without conflicting Tailwind utilities. */
export const cn = (...values: ClassValue[]) => twMerge(clsx(values))
/** Formats schema enum values for readable UI labels. */
export const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
/** Extracts a target hostname while tolerating archived or invalid values. */
export const hostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
/** Formats an ISO timestamp for compact table display. */
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
/** Anchors demo timestamps so sample scan ages remain understandable. */
export const relativeTime = (date: string | null) => {
  if (date === null) return 'Never scanned'
  const minutes = Math.max(
    0,
    Math.floor((Math.max(DEMO_DATE.getTime(), Date.now()) - new Date(date).getTime()) / 60000)
  )
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return `${Math.floor(minutes / 1440)} days ago`
}
/** Displays elapsed scan seconds or a missing-value marker. */
export const formatDuration = (seconds: number | null) =>
  seconds === null ? '--' : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
/** Escapes untrusted finding fields before HTML report generation. */
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char
  )

/** Produces a short avatar label from an API-supplied display name. */
export const initials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?'
