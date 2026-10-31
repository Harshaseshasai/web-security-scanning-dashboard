import { act, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../router'
import { useCompactNavigation } from '../hooks/use-compact-navigation'
import { renderView, resetStores, seededClient } from './render'

beforeEach(resetStores)

describe('shadcn-style navigation tooltips', () => {
  it('keeps expanded labels visible without redundant hover tooltips', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    const target = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole(
      'link',
      { name: 'Targets' }
    )
    expect(target).toHaveTextContent('Targets')
    expect(target).not.toHaveAttribute('title')
    await userEvent.hover(target)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows collapsed navigation labels on hover and keyboard focus', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const findings = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole(
      'link',
      { name: 'Findings' }
    )
    await userEvent.hover(findings)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Findings')
    await userEvent.unhover(findings)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    act(() => {
      findings.focus()
    })
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Findings')
    expect(findings).toHaveAccessibleName('Findings')
  })

  it('retains active navigation styling and working links inside tooltip triggers', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const reports = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole(
      'link',
      { name: 'Reports' }
    )
    await userEvent.click(reports)
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/reports'))
    expect(
      within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
        name: 'Reports',
      })
    ).toHaveClass('active')
  })

  it('describes compact workspace and utility controls without native title popups', async () => {
    renderView(<AppRoutes />, { route: '/dashboard', client: seededClient() })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    const settings = screen.getByRole('button', { name: 'Settings' })
    await userEvent.hover(settings)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Settings')
    expect(settings).not.toHaveAttribute('title')
    await userEvent.click(settings)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('explains icon-only header and target actions on hover', async () => {
    renderView(<AppRoutes />, { route: '/targets', client: seededClient() })
    const notifications = screen.getByRole('button', { name: 'Notifications' })
    await userEvent.hover(notifications)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Notifications')
    await userEvent.unhover(notifications)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    const edit = screen.getByRole('button', { name: 'Edit Customer application' })
    await userEvent.hover(edit)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Edit Customer application')
  })
})

describe('compact navigation breakpoint', () => {
  it('updates tooltip eligibility when the CSS sidebar breakpoint changes', () => {
    let compact = true
    const listeners = new Set<() => void>()
    const media = {
      get matches() {
        return compact
      },
      media: '(min-width: 681px) and (max-width: 900px)',
      addEventListener: (_type: string, listener: () => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners.delete(listener)
      },
    } as unknown as MediaQueryList
    vi.spyOn(window, 'matchMedia').mockReturnValue(media)
    const { result, unmount } = renderHook(() => useCompactNavigation())
    expect(result.current).toBe(true)
    compact = false
    act(() => {
      listeners.forEach((listener) => {
        listener()
      })
    })
    expect(result.current).toBe(false)
    unmount()
    expect(listeners.size).toBe(0)
  })
})
