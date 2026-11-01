import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFindingStore } from '../store/findings-filter.store'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore } from '../store/theme.store'
import { useUiStore } from '../store/ui.store'
import { TRANSITIONS } from '../lib/constants'
import {
  capitalize,
  cn,
  dateLabel,
  escapeHtml,
  formatDuration,
  hostname,
  relativeTime,
} from '../lib/utils'
import { findingsCsv, downloadFile } from '../lib/download'
import { findings } from '../mocks/data/findings'
import { resetStores } from './render'

beforeEach(resetStores)
describe('Session state', () => {
  it('rejects no-op and invalid finding transitions', () => {
    expect(useFindingStore.getState().setStatus('a', 'open', 'open')).toBe(false)
    expect(useFindingStore.getState().setStatus('a', 'open', 'resolved')).toBe(false)
    expect(useFindingStore.getState().overrides).toEqual({})
  })
  it('supports every allowed transition', () => {
    Object.entries(TRANSITIONS).forEach(([current, nextValues]) => {
      nextValues.forEach((next) => {
        expect(
          useFindingStore.getState().setStatus('a', current as keyof typeof TRANSITIONS, next)
        ).toBe(true)
        expect(useFindingStore.getState().overrides.a).toBe(next)
      })
    })
  })
  it('clears local triage state', () => {
    useFindingStore.getState().setStatus('a', 'open', 'confirmed')
    useFindingStore.getState().reset()
    expect(useFindingStore.getState().overrides).toEqual({})
  })
  it('stores the correct token and clears it on sign-out', () => {
    expect(useAuthStore.getState().session?.token).toBe('mock-jwt-token-demo')
    useAuthStore.getState().signOut()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem('sentinel-session')).toBe('signed-out')
  })
  it('persists and applies both theme directions', () => {
    useThemeStore.setState({ theme: 'light' })
    useThemeStore.getState().toggle()
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    useThemeStore.getState().toggle()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
  })
  it('handles sidebar, mobile, modal, and selection state', () => {
    useUiStore.getState().toggleCollapsed()
    expect(useUiStore.getState().collapsed).toBe(true)
    useUiStore.getState().setMobileOpen(true)
    expect(useUiStore.getState().mobileOpen).toBe(true)
    useUiStore.getState().openModal('target', 'tgt_01')
    expect(useUiStore.getState().editTargetId).toBe('tgt_01')
    useUiStore.getState().openModal('scan', 'tgt_03')
    expect(useUiStore.getState().preselectedTarget).toBe('tgt_03')
    useUiStore.getState().openModal('scan')
    expect(useUiStore.getState().preselectedTarget).toBe('')
    useUiStore.getState().openModal('target')
    expect(useUiStore.getState().editTargetId).toBeNull()
    useUiStore.getState().setSelectedRows(['a'])
    expect(useUiStore.getState().selectedRows).toEqual(['a'])
    useUiStore.getState().closeModal()
    expect(useUiStore.getState().modal).toBeNull()
  })
})
describe('Display and export utilities', () => {
  it('formats values without ambiguity', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(capitalize('false_positive')).toBe('False positive')
    expect(hostname('https://example.com/a')).toBe('example.com')
    expect(hostname('not-a-url')).toBe('not-a-url')
    expect(formatDuration(null)).toBe('--')
    expect(formatDuration(125)).toBe('2m 5s')
    expect(dateLabel('2026-10-31T00:00:00Z')).toBe('Oct 31, 2026')
    expect(escapeHtml('<&>"\'')).toBe('&lt;&amp;&gt;&quot;&#39;')
  })
  it('formats relative timestamps and unscanned targets', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-31T10:30:00Z').getTime())
    expect(relativeTime(null)).toBe('Never scanned')
    expect(relativeTime('2026-10-31T10:30:00Z')).toBe('Just now')
    expect(relativeTime('2026-10-31T10:25:00Z')).toBe('5 min ago')
    expect(relativeTime('2026-10-31T08:30:00Z')).toBe('2 hr ago')
    expect(relativeTime('2026-10-29T10:30:00Z')).toBe('2 days ago')
  })
  it('creates escaped CSV and mitigates spreadsheet formula injection', () => {
    const csv = findingsCsv([{ ...findings[0], title: '=SUM(1,2)', location: 'a"b' }])
    expect(csv).toContain("'=SUM(1,2)")
    expect(csv).toContain('a""b')
    expect(csv).toContain('ID,Title,Severity')
  })
  // Report downloads beyond the documented PDF placeholder are intentionally out of scope.
  it('revokes downloaded object URLs', () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadFile('test.txt', 'contents', 'text/plain')
    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
    vi.useRealTimers()
  })
})
