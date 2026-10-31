import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { api } from '../lib/api'
import { TargetSchema } from '../schemas/target.schema'
import { LoginSchema, SessionSchema } from '../schemas/auth.schema'
import LoginPage from '../pages/LoginPage'
import { AppRoutes } from '../router'
import { useAuthStore } from '../store/auth.store'
import { renderView, resetStores, seededClient } from './render'
import { server } from './setup'

beforeEach(resetStores)
describe('Validated API boundary', () => {
  it('parses successful list responses', async () => {
    expect(await api('/targets', z.array(TargetSchema))).toHaveLength(6)
  })
  it('rejects malformed server data instead of putting it in state', async () => {
    server.use(http.get('/api/targets', () => HttpResponse.json([{ id: 'bad' }])))
    await expect(api('/targets', z.array(TargetSchema))).rejects.toBeInstanceOf(z.ZodError)
  })
  it('retains a useful server error', async () => {
    server.use(
      http.get('/api/targets', () =>
        HttpResponse.json({ error: 'Service unavailable' }, { status: 503 })
      )
    )
    await expect(api('/targets', z.array(TargetSchema))).rejects.toThrow('Service unavailable')
  })
  it('handles non-contract error payloads', async () => {
    server.use(
      http.get('/api/targets', () => HttpResponse.json({ message: 'invalid' }, { status: 500 }))
    )
    await expect(api('/targets', z.array(TargetSchema))).rejects.toThrow('API 500')
  })
  it('requires the demo token for protected endpoints', async () => {
    useAuthStore.getState().signOut()
    await expect(api('/targets', z.array(TargetSchema))).rejects.toThrow('session has expired')
  })
  it('authenticates only the documented credentials', async () => {
    useAuthStore.getState().signOut()
    const body = LoginSchema.parse({ email: 'demo@example.com', password: 'password123' })
    expect((await api('/login', SessionSchema, { method: 'POST', body })).token).toBe(
      'mock-jwt-token-demo'
    )
    await expect(
      api('/login', SessionSchema, { method: 'POST', body: { ...body, password: 'wrong12345' } })
    ).rejects.toThrow('Incorrect email')
  })
})
describe('Login and protected routing', () => {
  beforeEach(() => {
    useAuthStore.getState().signOut()
  })
  it('validates email and password inline', async () => {
    renderView(<LoginPage />, { route: '/login' })
    await userEvent.type(screen.getByLabelText('Email address'), 'bad')
    await userEvent.type(screen.getByLabelText('Password'), '1234567')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
  })
  it('shows a persistent error for incorrect credentials and allows retry', async () => {
    renderView(<LoginPage />, { route: '/login' })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
  it('signs in with the demo shortcut and stores the token', async () => {
    renderView(<LoginPage />, { route: '/login' })
    await userEvent.click(screen.getByRole('button', { name: 'Enter demo workspace' }))
    await waitFor(() => {
      expect(useAuthStore.getState().session?.token).toBe('mock-jwt-token-demo')
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })
  it('disables submission while authentication is in flight', async () => {
    let finish: (() => void) | undefined
    server.use(
      http.post('/api/login', async () => {
        await new Promise<void>((resolve) => {
          finish = resolve
        })
        return HttpResponse.json({
          token: 'mock-jwt-token-demo',
          email: 'demo@example.com',
          name: 'Alex Morgan',
        })
      })
    )
    renderView(<LoginPage />, { route: '/login' })
    await userEvent.click(screen.getByRole('button', { name: 'Enter demo workspace' }))
    expect(await screen.findByRole('button', { name: /Signing in/ })).toBeDisabled()
    finish?.()
    await waitFor(() => {
      expect(useAuthStore.getState().session).not.toBeNull()
    })
  })
  it('redirects an unauthenticated protected route to login', async () => {
    renderView(<AppRoutes />, { route: '/findings', client: seededClient() })
    expect(await screen.findByRole('heading', { name: 'Sign in to Sentinel' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
  it('redirects an authenticated login visit to the dashboard', async () => {
    resetStores()
    renderView(<AppRoutes />, { route: '/login', client: seededClient() })
    expect(await screen.findByRole('heading', { name: 'Security overview' })).toBeInTheDocument()
  })
  it.each(['/', '/unknown-route'])('redirects authenticated %s to the dashboard', async (route) => {
    renderView(<AppRoutes />, { route, client: seededClient() })
    expect(await screen.findByRole('heading', { name: 'Sign in to Sentinel' })).toBeInTheDocument()
  })
  it('records sign-in only once for a form submit', async () => {
    const spy = vi.spyOn(useAuthStore.getState(), 'signIn')
    renderView(<LoginPage />, { route: '/login' })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'demo@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce()
    })
  })
})
