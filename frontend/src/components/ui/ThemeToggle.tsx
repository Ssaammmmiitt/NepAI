import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex cursor-pointer items-center gap-2 border border-dt-border bg-dt-bg px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.06em] text-dt-meta hover:border-dt-text hover:text-dt-text ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-dt-accent-bright" strokeWidth={1.5} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} />
      )}
      {showLabel ? (isDark ? 'Light' : 'Dark') : null}
    </button>
  )
}
