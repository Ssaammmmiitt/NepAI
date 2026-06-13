import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Content</p></Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Card title="Stats"><p>Data</p></Card>)
    expect(screen.getByText('Stats')).toBeInTheDocument()
  })

  it('does not render title section when no title or action', () => {
    const { container } = render(<Card><p>Only content</p></Card>)
    const headings = container.querySelectorAll('h3')
    expect(headings).toHaveLength(0)
  })

  it('renders action alongside title', () => {
    render(
      <Card title="Metrics" action={<button>Refresh</button>}>
        <p>Body</p>
      </Card>,
    )
    expect(screen.getByText('Metrics')).toBeInTheDocument()
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })

  it('applies dt-card class', () => {
    const { container } = render(<Card><p>Test</p></Card>)
    expect(container.firstChild).toHaveClass('dt-card')
  })

  it('applies hover class when hover prop is set', () => {
    const { container } = render(<Card hover><p>Hoverable</p></Card>)
    expect(container.firstChild).toHaveClass('dt-card-hover')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="!p-4"><p>Hi</p></Card>)
    expect((container.firstChild as HTMLElement).className).toContain('!p-4')
  })
})
