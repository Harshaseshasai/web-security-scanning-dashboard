import { http } from 'msw'
import { mockRequest } from '../service'
export const scansHandlers = [http.all('/api/scans', ({ request }) => mockRequest(request))]
