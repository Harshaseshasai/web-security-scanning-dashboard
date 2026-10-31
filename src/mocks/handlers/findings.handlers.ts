import { http } from 'msw'
import { mockRequest } from '../service'
export const findingsHandlers = [
  http.get('/api/findings', ({ request }) => mockRequest(request)),
  http.get('/api/findings/query', ({ request }) => mockRequest(request)),
  http.get('/api/findings/:id', ({ request }) => mockRequest(request)),
]
