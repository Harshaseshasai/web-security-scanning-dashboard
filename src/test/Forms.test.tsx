import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { TargetForm } from '../components/features/targets/TargetForm'
import { ScanForm } from '../components/features/scans/ScanForm'
import { ReportForm } from '../components/features/reports/ReportForm'
import { renderView, resetStores, seededClient } from './render'
import { server } from './setup'
import { targets } from '../mocks/data/targets'
import { scans } from '../mocks/data/scans'
import { reports } from '../mocks/data/reports'
import { useUiStore } from '../store/ui.store'

beforeEach(resetStores)
/** Fills the shared valid target fields used by form submission tests. */
function fillTarget() {
  fireEvent.change(screen.getByLabelText('Target name'), { target: { value: 'New website' } })
  fireEvent.change(screen.getByLabelText('Target URL'), {
    target: { value: 'https://new.example.com' },
  })
}
describe('Target creation and editing', () => {
  it('publishes a server-assigned target ID before the dialog closes', async () => {
    server.use(
      http.post('/api/targets', () =>
        HttpResponse.json({
          ...targets[0],
          id: 'server-target',
          name: 'New website',
          url: 'https://new.example.com',
          authenticated: false,
        })
      )
    )
    const client = seededClient()
    const close = vi.fn(() => {
      expect(client.getQueryData(['targets'])).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'server-target', name: 'New website' }),
        ])
      )
    })
    renderView(<TargetForm onClose={close} />, { client })
    fillTarget()
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce()
    })
  })
  it('shows validation errors for empty fields and credentials', async () => {
    renderView(<TargetForm onClose={vi.fn()} />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(screen.getByText('Only HTTP and HTTPS targets are supported')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('This target requires authentication'))
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(screen.getByText('Username required for authenticated scans')).toBeInTheDocument()
    expect(screen.getByText('Password required for authenticated scans')).toBeInTheDocument()
  })
  it('prevents duplicate submissions and optimistically inserts a target', async () => {
    let finish: (() => void) | undefined
    const request = vi.fn()
    server.use(
      http.post('/api/targets', async () => {
        request()
        await new Promise<void>((resolve) => {
          finish = resolve
        })
        return HttpResponse.json({
          ...targets[0],
          id: 'new',
          name: 'New website',
          url: 'https://new.example.com',
          authenticated: false,
        })
      })
    )
    const close = vi.fn()
    const client = seededClient()
    renderView(<TargetForm onClose={close} />, { client })
    fillTarget()
    await userEvent.dblClick(screen.getByRole('button', { name: 'Add target' }))
    expect(await screen.findByRole('button', { name: 'Adding target...' })).toBeDisabled()
    await waitFor(() => {
      expect(request).toHaveBeenCalledOnce()
    })
    expect(client.getQueryData<unknown[]>(['targets'])?.length).toBe(7)
    await act(async () => {
      finish?.()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce()
    })
  })
  it('rolls back optimistic data and re-enables submit after failure', async () => {
    server.use(
      http.post('/api/targets', () =>
        HttpResponse.json({ error: 'Duplicate URL' }, { status: 409 })
      )
    )
    const client = seededClient()
    renderView(<TargetForm onClose={vi.fn()} />, { client })
    fillTarget()
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Duplicate URL')
    expect(screen.getByRole('button', { name: 'Add target' })).toBeEnabled()
    expect(client.getQueryData<unknown[]>(['targets'])?.length).toBe(6)
  })
  it('edits an existing target and validates authenticated credentials', async () => {
    const close = vi.fn()
    server.use(
      http.put('/api/targets/tgt_01', () =>
        HttpResponse.json({ ...targets[0], name: 'Updated website' })
      )
    )
    renderView(<TargetForm target={targets[0]} onClose={close} />, { client: seededClient() })
    fireEvent.change(screen.getByLabelText('Target name'), { target: { value: 'Updated website' } })
    fireEvent.change(screen.getByLabelText('Scan username'), { target: { value: 'scanner' } })
    fireEvent.change(screen.getByLabelText('Scan password'), { target: { value: 'secret123' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save target' }))
    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce()
    })
  })
  it('cancels without a mutation', async () => {
    const close = vi.fn()
    renderView(<TargetForm onClose={close} />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalledOnce()
  })
})
describe('New scan safeguards', () => {
  it('requires a target and authorization', async () => {
    renderView(<ScanForm targetId="" onClose={vi.fn()} />, { client: seededClient() })
    fireEvent.submit(screen.getByRole('button', { name: 'Start scan' }).closest('form')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a target')
    await userEvent.selectOptions(screen.getByLabelText('Target'), 'tgt_03')
    await userEvent.click(screen.getByRole('button', { name: 'Start scan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm you are authorized')
  })
  it('submits a valid authorized scan exactly once', async () => {
    const request = vi.fn()
    server.use(
      http.post('/api/scans', () => {
        request()
        return HttpResponse.json({
          ...scans[0],
          id: 'scan-new',
          targetId: 'tgt_03',
          status: 'queued',
          progress: 0,
        })
      })
    )
    const close = vi.fn()
    renderView(<ScanForm targetId="tgt_03" onClose={close} />, { client: seededClient() })
    await userEvent.click(screen.getByLabelText('I am authorized to test this target.'))
    await userEvent.click(screen.getByRole('button', { name: 'Start scan' }))
    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce()
    })
    expect(request).toHaveBeenCalledOnce()
    expect(screen.getByTestId('location')).toHaveTextContent('/scans')
  })
  it('renders persistent API errors', async () => {
    server.use(
      http.post('/api/scans', () =>
        HttpResponse.json({ error: 'Active scan already exists' }, { status: 409 })
      )
    )
    renderView(<ScanForm targetId="tgt_03" onClose={vi.fn()} />, { client: seededClient() })
    await userEvent.click(screen.getByLabelText('I am authorized to test this target.'))
    await userEvent.click(screen.getByRole('button', { name: 'Start scan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Active scan already exists')
    expect(screen.getByRole('button', { name: 'Start scan' })).toBeEnabled()
  })
  it('offers target creation when the workspace is empty', async () => {
    const client = seededClient()
    client.setQueryData(['targets'], [])
    renderView(<ScanForm targetId="" onClose={vi.fn()} />, { client })
    await userEvent.click(screen.getByRole('button', { name: 'Add target' }))
    expect(useUiStore.getState().modal).toBe('target')
  })
  it('cancels scan creation', async () => {
    const close = vi.fn()
    renderView(<ScanForm targetId="" onClose={close} />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalledOnce()
  })
})
describe('Report retry and idempotency', () => {
  it('retains an inline 503 error and succeeds on explicit retry', async () => {
    let attempts = 0
    server.use(
      http.post('/api/reports/generate', () => {
        attempts++
        return attempts === 1
          ? HttpResponse.json(
              { error: 'Report service temporarily unavailable. Please retry.' },
              { status: 503 }
            )
          : HttpResponse.json(reports[0])
      })
    )
    const close = vi.fn()
    renderView(<ReportForm onClose={close} />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Generate report' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable')
    const retry = screen.getByRole('button', { name: 'Retry generation' })
    expect(retry).toBeEnabled()
    await new Promise((resolve) => setTimeout(resolve, 510))
    await userEvent.click(retry)
    await waitFor(() => {
      expect(close).toHaveBeenCalledOnce()
    })
    expect(attempts).toBe(2)
  })
  it('blocks repeated clicks while generation is in flight', async () => {
    let finish: (() => void) | undefined
    const request = vi.fn()
    server.use(
      http.post('/api/reports/generate', async () => {
        request()
        await new Promise<void>((resolve) => {
          finish = resolve
        })
        return HttpResponse.json(reports[0])
      })
    )
    renderView(<ReportForm onClose={vi.fn()} />, { client: seededClient() })
    await userEvent.dblClick(screen.getByRole('button', { name: 'Generate report' }))
    expect(await screen.findByRole('button', { name: 'Generating...' })).toBeDisabled()
    expect(request).toHaveBeenCalledOnce()
    await act(async () => {
      finish?.()
      await Promise.resolve()
    })
  })
  it('requires a completed scan', async () => {
    const client = seededClient()
    client.setQueryData(['scans'], [])
    renderView(<ReportForm onClose={vi.fn()} />, { client })
    await userEvent.click(screen.getByRole('button', { name: 'New scan' }))
    expect(useUiStore.getState().modal).toBe('scan')
  })
  it('cancels report creation', async () => {
    const close = vi.fn()
    renderView(<ReportForm onClose={close} />, { client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalledOnce()
  })
})
