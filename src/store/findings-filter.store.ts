import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { FindingStatus } from '@/types'
import { TRANSITIONS } from '@/lib/constants'

// Section 8.5: filters belong to the URL; only session-only triage lives in this store.
export const useFindingStore = create(
  subscribeWithSelector<{
    overrides: Partial<Record<string, FindingStatus>>
    setStatus: (id: string, current: FindingStatus, next: FindingStatus) => boolean
    reset: () => void
  }>((set) => ({
    overrides: {},
    /** Rejects no-op or invalid triage transitions before storing a local override. */
    setStatus: (id, current, next) => {
      if (current === next || !TRANSITIONS[current].includes(next)) return false
      set((state) => ({ overrides: { ...state.overrides, [id]: next } }))
      return true
    },
    /** Discards local triage overrides when a session ends. */
    reset: () => {
      set({ overrides: {} })
    },
  }))
)
