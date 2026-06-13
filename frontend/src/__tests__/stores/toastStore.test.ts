import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore } from '@/store/toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  it('show adds a toast with default success variant', () => {
    useToastStore.getState().show('Test message')
    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Test message')
    expect(toasts[0].variant).toBe('success')
    expect(toasts[0].id).toBeTruthy()
  })

  it('show adds a toast with error variant', () => {
    useToastStore.getState().show('Error!', 'error')
    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].variant).toBe('error')
  })

  it('multiple toasts accumulate', () => {
    useToastStore.getState().show('First')
    useToastStore.getState().show('Second')
    expect(useToastStore.getState().toasts).toHaveLength(2)
  })

  it('dismiss removes a specific toast', () => {
    useToastStore.getState().show('A')
    useToastStore.getState().show('B')
    const [first] = useToastStore.getState().toasts
    useToastStore.getState().dismiss(first.id)
    const remaining = useToastStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('B')
  })

  it('auto-dismisses after timeout', () => {
    useToastStore.getState().show('Auto')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(3300)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
