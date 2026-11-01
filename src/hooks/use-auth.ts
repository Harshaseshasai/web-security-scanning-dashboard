import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LoginSchema,
  AuthConfigSchema,
  SessionSchema,
  WorkspaceSchema,
} from '@/schemas/auth.schema'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { Login } from '@/types'

/** Validates credentials, authenticates through the mock API, and commits the returned session. */
export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Login) => {
      const credentials = LoginSchema.parse(input)
      return api('/login', SessionSchema, { method: 'POST', body: credentials })
    },
    onSuccess: (session) => {
      queryClient.removeQueries({ queryKey: ['workspace'] })
      signIn(session)
    },
  })
}

/** Loads documented demo credentials from the public mock endpoint. */
export function useAuthConfig() {
  return useQuery({
    queryKey: ['auth', 'config'],
    queryFn: ({ signal }) => api('/auth/config', AuthConfigSchema, { signal }),
    staleTime: Number.POSITIVE_INFINITY,
  })
}

/** Resolves the workspace display name from the UUID returned at authentication. */
export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: ({ signal }) =>
      api(`/workspaces/${encodeURIComponent(workspaceId)}`, WorkspaceSchema, { signal }),
    enabled: workspaceId.length > 0,
  })
}
