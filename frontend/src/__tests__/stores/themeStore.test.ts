import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '@/store/themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
    document.documentElement.classList.remove('dark')
  })

  it('initial theme is light', () => {
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggleTheme switches from light to dark', () => {
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches from dark to light', () => {
    useThemeStore.setState({ theme: 'dark' })
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme applies the given theme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
