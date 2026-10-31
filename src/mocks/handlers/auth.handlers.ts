import { http } from 'msw'
import { mockRequest } from '../service'

/** Public login configuration and the authenticated session lookup. */
export const authHandlers = [
  http.get('/api/auth/config', ({ request }) => mockRequest(request)),
  http.post('/api/login', ({ request }) => mockRequest(request)),
  http.get('/api/session', ({ request }) => mockRequest(request)),
]
