import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

vi.mock('../mocks/utils', () => ({
  delay: () => Promise.resolve(),
  DELIBERATE_ERROR_PATH: '/api/reports/generate',
}))
export const server = setupServer(...handlers)
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => {
  server.close()
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:test') })
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() })
HTMLElement.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
