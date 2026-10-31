import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateTargetSchema, TargetSchema } from '../schemas/target.schema'
import { SuccessSchema } from '../schemas/auth.schema'
import { api } from '../lib/api'
import type { CreateTarget, Target } from '../types'

/** Creates a target with an optimistic cache entry and one idempotency key. */
export function useCreateTarget() {
  const client = useQueryClient()
  const key = useRef(crypto.randomUUID())
  return useMutation({
    mutationFn: (body: CreateTarget) => {
      const validated = CreateTargetSchema.parse(body)
      return api('/targets', TargetSchema, {
        method: 'POST',
        body: validated,
        key: key.current,
      })
    },
    onMutate: async (body) => {
      await client.cancelQueries({ queryKey: ['targets'] })
      const previous = client.getQueryData<Target[]>(['targets'])
      const optimistic: Target = {
        id: `pending_${key.current}`,
        name: body.name,
        url: body.url,
        environment: body.environment,
        authenticated: body.authenticated,
        lastScannedAt: null,
        openFindings: 0,
      }
      client.setQueryData<Target[]>(['targets'], (current = []) => [optimistic, ...current])
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (context?.previous !== undefined) client.setQueryData(['targets'], context.previous)
    },
    onSuccess: (saved) => {
      client.setQueryData<Target[]>(['targets'], (current = []) =>
        current.map((item) => (item.id === `pending_${key.current}` ? saved : item))
      )
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['targets'] }),
  })
}

/** Edits a target optimistically while preserving its identity and server metadata. */
export function useUpdateTarget(target?: Target) {
  const client = useQueryClient()
  const key = useRef(crypto.randomUUID())
  return useMutation({
    mutationFn: (body: CreateTarget) => {
      if (target === undefined) throw new Error('No target selected for editing.')
      const validated = CreateTargetSchema.parse(body)
      return api(`/targets/${target.id}`, TargetSchema, {
        method: 'PUT',
        body: validated,
        key: key.current,
      })
    },
    onMutate: async (body) => {
      if (target === undefined) return { previous: undefined }
      await client.cancelQueries({ queryKey: ['targets'] })
      const previous = client.getQueryData<Target[]>(['targets'])
      client.setQueryData<Target[]>(['targets'], (current = []) =>
        current.map((item) => (item.id === target.id ? { ...item, ...body, id: target.id } : item))
      )
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (context?.previous !== undefined) client.setQueryData(['targets'], context.previous)
    },
    onSuccess: (saved) => {
      client.setQueryData<Target[]>(['targets'], (current = []) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      )
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['targets'] }),
  })
}

/** Deletes a target optimistically and rolls back the cache when the request fails. */
export function useDeleteTarget() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/targets/${id}`, SuccessSchema, { method: 'DELETE' }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ['targets'] })
      const previous = client.getQueryData<Target[]>(['targets'])
      client.setQueryData<Target[]>(['targets'], (current = []) =>
        current.filter((target) => target.id !== id)
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous !== undefined) client.setQueryData(['targets'], context.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['targets'] }),
  })
}
