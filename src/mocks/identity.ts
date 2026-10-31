import { UserSchema, WorkspaceSchema } from '../schemas/auth.schema'

/**
 * Mock-backend identity directory. These values are resolved by API endpoints,
 * not imported by screens. The workspace is deliberately keyed by UUID.
 */
export const DEMO_WORKSPACE_ID = 'c4f9d2a8-63b1-4d8f-9e5a-1a2b3c4d5e6f'
export const DEMO_USER_ID = '6d3b8a21-5f4c-4d1e-9a7b-2c8e0f1a3b5d'
export const MOCK_AUTH_TOKEN = 'mock-jwt-token-demo'

export const mockUser = UserSchema.parse({
  id: DEMO_USER_ID,
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'Security analyst',
})

export const mockWorkspace = WorkspaceSchema.parse({
  id: DEMO_WORKSPACE_ID,
  name: 'Demo Company',
  plan: 'Demo workspace',
})

export const mockAuthConfig = {
  demoEmail: mockUser.email,
  demoPassword: 'password123',
} as const

export const mockWorkspaceDirectory = new Map([[mockWorkspace.id, mockWorkspace]])
