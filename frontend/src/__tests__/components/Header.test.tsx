import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'
import { useStockStore } from '@/store/stockStore'

vi.mock('@/components/widgets/LiveClock', () => ({
  LiveClock: () => <span data-testid="live-clock">clock</span>,
}))

describe('Header', () => {
  beforeEach(() => {
    useStockStore.setState({
      tickers: [],
      loading: false,
      error: null,
      lastFetched: null,
      dataUpdatedTo: null,
    })
  })

  it('renders title and subtitle', () => {
    render(<Header title="Dashboard" subtitle="Overview" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(<Header title="Test" action={<button>Search</button>} />)
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('does not show data date badge when dataUpdatedTo is null', () => {
    render(<Header title="Test" />)
    expect(screen.queryByText(/Data to/)).not.toBeInTheDocument()
  })

  it('shows data date badge when dataUpdatedTo is set', () => {
    useStockStore.setState({ dataUpdatedTo: '2026-07-07' })
    render(<Header title="Test" />)
    expect(screen.getByText(/Data to/)).toBeInTheDocument()
    expect(screen.getByText('2026-07-07')).toBeInTheDocument()
  })

  it('renders LiveClock', () => {
    render(<Header title="Test" />)
    expect(screen.getByTestId('live-clock')).toBeInTheDocument()
  })
})
