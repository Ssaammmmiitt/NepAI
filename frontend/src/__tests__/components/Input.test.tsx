import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders without label', () => {
    const { container } = render(<Input placeholder="type..." />)
    expect(container.querySelector('input')).toBeInTheDocument()
    expect(container.querySelector('label')).not.toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Name" error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('fires onChange', () => {
    const handleChange = vi.fn()
    render(<Input label="Test" onChange={handleChange} />)
    fireEvent.change(screen.getByLabelText('Test'), { target: { value: 'hello' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('passes HTML attributes through', () => {
    render(<Input label="Password" type="password" minLength={6} />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('minlength', '6')
  })

  it('generates id from label', () => {
    render(<Input label="Full Name" />)
    const input = screen.getByLabelText('Full Name')
    expect(input.id).toBe('full-name')
  })

  it('uses provided id over generated', () => {
    render(<Input label="Email" id="custom-id" />)
    expect(screen.getByLabelText('Email').id).toBe('custom-id')
  })
})
