import { StockSearch } from '../widgets/StockSearch';
import { ThemeToggle } from '../ui/ThemeToggle';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function Header({ title, subtitle, rightSlot }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="text-display">{title}</h1>
        {subtitle && <p className="text-caption">{subtitle}</p>}
      </div>
      <div className="header-right">
        {rightSlot}
        <ThemeToggle />
        <StockSearch />
      </div>
    </header>
  );
}
