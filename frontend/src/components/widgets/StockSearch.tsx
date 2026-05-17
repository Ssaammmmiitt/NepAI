import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';
import './StockSearch.css';

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
    <div ref={containerRef} className="stock-search">
      <div className="stock-search-input">
        <Search size={16} color="var(--text-secondary)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search ticker..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="stock-search-results">
          {results.map((r) => (
            <li key={r.ticker} onClick={() => handleSelect(r.ticker)}>
              <span className="text-body">{r.ticker}</span>
              <span className="text-caption">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
