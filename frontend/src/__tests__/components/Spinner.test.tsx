import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Spinner } from '@/components/ui/Spinner'

describe('Spinner', () => {
  it('renders with role status', () => {
    const { getByRole } = render(<Spinner />)
    expect(getByRole('status')).toBeInTheDocument()
  })

  it('applies sm size class', () => {
    const { getByRole } = render(<Spinner size="sm" />)
    expect(getByRole('status').className).toContain('h-4')
  })

  it('applies md size class by default', () => {
    const { getByRole } = render(<Spinner />)
    expect(getByRole('status').className).toContain('h-6')
  })

  it('applies lg size class', () => {
    const { getByRole } = render(<Spinner size="lg" />)
    expect(getByRole('status').className).toContain('h-10')
  })

  it('has aria-label', () => {
    const { getByRole } = render(<Spinner />)
    expect(getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })
})
