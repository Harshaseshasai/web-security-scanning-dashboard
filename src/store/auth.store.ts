import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { SessionSchema } from '../schemas/auth.schema'
import type { Session } from '../types'

/** Restores a validated tab session; first-time visitors must sign in to the demo. */
function initialSession(): Session | null {
  try {
    const stored = sessionStorage.getItem('sentinel-session')
    if (stored === null || stored === 'signed-out') return null
    return SessionSchema.parse(JSON.parse(stored))
  } catch {
    return null
  }
}

// Section 6: domain data is schema-derived; React/store behavior uses structural signatures.
export const useAuthStore = create(
  subscribeWithSelector<{
    session: Session | null
    signIn: (session: Session) => void
    signOut: () => void
  }>((set) => ({
    session: initialSession(),
    /** Validates and stores the authenticated session for this tab. */
    signIn: (session) => {
      const parsed = SessionSchema.parse(session)
      sessionStorage.setItem('sentinel-session', JSON.stringify(parsed))
      set({ session: parsed })
    },
    /** Clears access and remembers that the analyst intentionally signed out. */
    signOut: () => {
      sessionStorage.setItem('sentinel-session', 'signed-out')
      set({ session: null })
    },
  }))
)
