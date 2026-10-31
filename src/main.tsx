import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { enableDemoTransport } from './lib/api'

/** Starts the development-only mock worker before mounting the protected app. */
async function start() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
    } catch {
      // Section 7.1: embedded previews may disallow service workers; share the same contract.
      enableDemoTransport()
    }
  }
  const root = document.getElementById('root')
  if (root === null) throw new Error('Missing application root')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
void start()
