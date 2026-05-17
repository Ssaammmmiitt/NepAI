import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';

export function StockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ ticker: string; name: string; sector: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allTickers, setAllTickers] = useState<{ ticker: string; name: string; sector: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTickers().then((tickers) => {
      setAllTickers(tickers.map((t) => ({ ticker: t.ticker, name: t.name, sector: t.sector })));
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const filtered = allTickers
      .filter(
        (t) =>
          t.ticker.toLowerCase().includes(value.toLowerCase()) ||
          t.name.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 8);
    setResults(filtered);
    setIsOpen(true);
  };

  const handleSelect = (ticker: string) => {
    setQuery(ticker);
    setIsOpen(false);
    navigate(`/stock/${ticker}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-border-color rounded-lg transition-all duration-200 focus-within:border-accent-primary focus-within:shadow-glow">
        <Search size={16} color="var(--color-text-secondary)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search ticker..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="flex-1 bg-none border-none text-text-primary font-sans text-sm outline-none placeholder:text-text-secondary"
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-bg-card border border-border-color rounded-lg list-none p-1 max-h-60 overflow-y-auto z-[100] shadow-card">
          {results.map((r) => (
            <li
              key={r.ticker}
              onClick={() => handleSelect(r.ticker)}
              className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-bg-hover"
            >
              <span className="text-sm">{r.ticker}</span>
              <span className="text-xs text-text-secondary">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
