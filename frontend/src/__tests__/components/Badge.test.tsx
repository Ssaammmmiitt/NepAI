import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Fresh</Badge>)
    expect(screen.getByText('Fresh')).toBeInTheDocument()
  })

  it('applies neutral variant by default', () => {
    render(<Badge>Status</Badge>)
    const badge = screen.getByText('Status')
    expect(badge.className).toContain('border-dt-border')
  })

  it('applies positive variant classes', () => {
    render(<Badge variant="positive">Up</Badge>)
    const badge = screen.getByText('Up')
    expect(badge.className).toContain('border-dt-accent-bright')
  })

  it('applies negative variant classes', () => {
    render(<Badge variant="negative">Down</Badge>)
    const badge = screen.getByText('Down')
    expect(badge.className).toContain('border-dt-negative')
  })

  it('applies custom className', () => {
    render(<Badge className="mt-2">Test</Badge>)
    expect(screen.getByText('Test').className).toContain('mt-2')
  })
})
