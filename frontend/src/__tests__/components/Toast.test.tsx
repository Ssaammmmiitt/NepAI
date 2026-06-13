import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastContainer } from '@/components/ui/Toast'
import { useToastStore } from '@/store/toastStore'

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toast messages', () => {
    useToastStore.setState({
      toasts: [
        { id: '1', message: 'Added NABIL', variant: 'success' },
        { id: '2', message: 'Error occurred', variant: 'error' },
      ],
    })
    render(<ToastContainer />)
    expect(screen.getByText('Added NABIL')).toBeInTheDocument()
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('renders dismiss buttons', () => {
    useToastStore.setState({
      toasts: [{ id: '1', message: 'Test', variant: 'success' }],
    })
    render(<ToastContainer />)
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
  })
})
