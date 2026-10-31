import { http } from 'msw'
import { mockRequest } from '../service'
export const reportsHandlers = [
  http.all('/api/reports', ({ request }) => mockRequest(request)),
  http.post('/api/reports/generate', ({ request }) => mockRequest(request)),
]
