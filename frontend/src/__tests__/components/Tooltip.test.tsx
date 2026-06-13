import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from '@/components/ui/Tooltip'

describe('Tooltip', () => {
  it('renders children when disabled', () => {
    render(
      <Tooltip content="Hidden" disabled>
        <button type="button">Trigger</button>
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on hover', () => {
    render(
      <Tooltip content="Company name">
        <button type="button">NABIL</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'NABIL' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Company name')
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'NABIL' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
