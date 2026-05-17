import { useState } from 'react';
import { StockSearch } from '../widgets/StockSearch';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function Header({ title, subtitle, rightSlot }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-4 md:px-8 md:py-6 border-b border-border-color bg-bg-secondary gap-3">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center justify-center w-9 h-9 bg-bg-hover border border-border-color rounded-xl text-text-secondary cursor-pointer transition-all duration-200 hover:border-accent-primary hover:text-accent-primary"
            aria-label="Toggle search"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <ThemeToggle />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3 md:gap-4 flex-shrink-0">
        {rightSlot}
        <div className="w-48 lg:w-64">
          <StockSearch />
        </div>
        <ThemeToggle />
      </div>
      {searchOpen && (
        <div className="md:hidden w-full animate-[slideIn_0.2s_ease]">
          <StockSearch />
        </div>
      )}
    </header>
  );
}
