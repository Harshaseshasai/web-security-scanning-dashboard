import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**',
        'src/mocks/**',
        'src/main.tsx',
        'src/test/**',
        'src/types/**',
        'src/vite-env.d.ts',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
})
