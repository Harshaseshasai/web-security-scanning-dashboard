import { http } from 'msw'
import { mockRequest } from '../service'
export const targetsHandlers = [
  http.all('/api/targets', ({ request }) => mockRequest(request)),
  http.all('/api/targets/:id', ({ request }) => mockRequest(request)),
]
