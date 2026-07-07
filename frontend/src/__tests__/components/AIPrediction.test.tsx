import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIPrediction } from '@/components/cards/AIPrediction'
import type { Prediction } from '@/types'

vi.mock('@/services/api', () => ({
  trainAPI: {
    train: vi.fn(),
  },
}))

import { trainAPI } from '@/services/api'

const basePrediction: Prediction = {
  ticker: 'NABIL',
  stock_name: 'Nabil Bank',
  stock_sector: 'Commercial Bank',
  model_available: true,
  trained_on: '2026-07-01T10:00:00',
  stale: false,
  predictions: [
    { day: 1, date: '2026-07-08', price: 510, change_pct: 2.0 },
    { day: 2, date: '2026-07-09', price: 515, change_pct: 3.0 },
  ],
  model_accuracy: 0.95,
  generated_at: '2026-07-07T10:00:00',
}

describe('AIPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading text when loading', () => {
    render(<AIPrediction ticker="NABIL" prediction={null} loading />)
    expect(screen.getByText('Performing AI prediction')).toBeInTheDocument()
  })

  it('shows retrain button even when model is fresh (not stale)', () => {
    render(
      <AIPrediction
        ticker="NABIL"
        prediction={{ ...basePrediction, stale: false }}
      />,
    )
    expect(screen.getByText('Retrain Model')).toBeInTheDocument()
  })

  it('shows retrain button when model is stale', () => {
    render(
      <AIPrediction
        ticker="NABIL"
        prediction={{ ...basePrediction, stale: true }}
      />,
    )
    expect(screen.getByText('Retrain Model')).toBeInTheDocument()
  })

  it('shows accepted banner on 202 response and does not call onRetrainComplete', async () => {
    vi.mocked(trainAPI.train).mockResolvedValue({
      status: 202,
      data: { message: 'Request accepted', ticker: 'NABIL' },
    } as never)

    const onRetrainComplete = vi.fn()
    render(
      <AIPrediction
        ticker="NABIL"
        prediction={{ ...basePrediction, stale: false }}
        onRetrainComplete={onRetrainComplete}
      />,
    )

    fireEvent.click(screen.getByText('Retrain Model'))

    await waitFor(() => {
      expect(screen.getByText('Request Accepted')).toBeInTheDocument()
    })
    expect(screen.getByText(/Training request for NABIL has been queued/)).toBeInTheDocument()
    expect(screen.getByText(/resource constraints/)).toBeInTheDocument()
    expect(onRetrainComplete).not.toHaveBeenCalled()
  })

  it('calls onRetrainComplete on non-202 success response', async () => {
    vi.mocked(trainAPI.train).mockResolvedValue({
      status: 200,
      data: { ticker: 'NABIL', status: 'completed' },
    } as never)

    const onRetrainComplete = vi.fn()
    render(
      <AIPrediction
        ticker="NABIL"
        prediction={{ ...basePrediction, stale: false }}
        onRetrainComplete={onRetrainComplete}
      />,
    )

    fireEvent.click(screen.getByText('Retrain Model'))

    await waitFor(() => {
      expect(onRetrainComplete).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText('Request Accepted')).not.toBeInTheDocument()
  })

  it('disables retrain button after 202 accepted', async () => {
    vi.mocked(trainAPI.train).mockResolvedValue({
      status: 202,
      data: { message: 'Request accepted', ticker: 'NABIL' },
    } as never)

    render(
      <AIPrediction
        ticker="NABIL"
        prediction={{ ...basePrediction, stale: false }}
      />,
    )

    fireEvent.click(screen.getByText('Retrain Model'))

    await waitFor(() => {
      expect(screen.getByText('Request Accepted')).toBeInTheDocument()
    })

    const btn = screen.getByRole('button', { name: /Retrain Model/ })
    expect(btn).toBeDisabled()
  })

  it('shows accepted banner for train button (no model) on 202', async () => {
    vi.mocked(trainAPI.train).mockResolvedValue({
      status: 202,
      data: { message: 'Request accepted', ticker: 'NABIL' },
    } as never)

    render(
      <AIPrediction
        ticker="NABIL"
        prediction={null}
      />,
    )

    fireEvent.click(screen.getByText('Train Model'))

    await waitFor(() => {
      expect(screen.getByText('Request Accepted')).toBeInTheDocument()
    })
    expect(screen.getByText(/Training request for NABIL has been queued/)).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Train Model/ })
    expect(btn).toBeDisabled()
  })
})
