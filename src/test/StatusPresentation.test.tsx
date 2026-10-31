import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { SeverityBadge, StatusBadge } from '../components/ui/Badges'
import { Button } from '../components/ui/Button'
import { renderView } from './render'

describe('analyst-facing severity and loading states', () => {
  it('names severity in both text and accessible labels without decoration', () => {
    renderView(<SeverityBadge severity="critical" />)
    const severity = screen.getByLabelText('Severity: Critical')
    expect(severity).toHaveTextContent('Critical')
    expect(severity.querySelector('svg')).toBeNull()
    expect(severity).toHaveClass('severity-critical')
  })

  it('expresses running and completed states as words with noncircular marks', () => {
    renderView(
      <>
        <StatusBadge status="running" />
        <StatusBadge status="completed" />
      </>
    )
    const running = screen.getByText('Running')
    expect(running.querySelector('.status-mark')).toBeInTheDocument()
    expect(running.querySelector('svg')).toBeNull()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('uses text and aria-busy rather than a spinning loader in pending actions', () => {
    renderView(<Button loading>Generating...</Button>)
    const button = screen.getByRole('button', { name: 'Generating...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('svg')).toBeNull()
  })
})
