import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      className="flex items-center justify-center w-9 h-9 bg-toggle-bg border border-border-color rounded-xl text-toggle-icon cursor-pointer transition-all duration-200 flex-shrink-0 hover:border-accent-primary hover:shadow-glow"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
