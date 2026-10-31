/** Simulates real API latency so data views exercise loading states. */
export const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 300 + Math.random() * 500))
export const DELIBERATE_ERROR_PATH = '/api/reports/generate'
