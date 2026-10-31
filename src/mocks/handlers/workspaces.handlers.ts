import { http } from 'msw'
import { mockRequest } from '../service'

/** Workspace identity is resolved by the UUID returned from authentication. */
export const workspaceHandlers = [
  http.get('/api/workspaces/:id', ({ request }) => mockRequest(request)),
]
