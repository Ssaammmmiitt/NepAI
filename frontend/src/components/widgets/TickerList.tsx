import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';
import type { StockTicker } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';
import { ChevronRight } from 'lucide-react';

const ROW_HEIGHT = 49;
const BUFFER_ROWS = 5;
const VISIBLE_ROWS = 12;

export function TickerList() {
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'ticker' | 'change'>('ticker');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [scrollTop, setScrollTop] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTickers().then((data) => {
      setTickers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setShowScrollHint(el.scrollWidth > el.clientWidth + 10);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tickers.length]);

  const handleSort = (field: 'ticker' | 'change') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...tickers].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'ticker') return mult * a.ticker.localeCompare(b.ticker);
      return mult * (a.change - b.change);
    });
  }, [tickers, sortField, sortDir]);

  const totalHeight = sorted.length * ROW_HEIGHT;

  const { visibleStart, visibleEnd } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const end = Math.min(
      sorted.length,
      Math.ceil((scrollTop + VISIBLE_ROWS * ROW_HEIGHT) / ROW_HEIGHT) + BUFFER_ROWS
    );
    return { visibleStart: start, visibleEnd: end };
  }, [scrollTop, sorted.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (loading) return <Spinner label="Loading tickers..." />;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl shadow-card transition-all duration-200 hover:border-border-glow">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-color">
        <h3 className="text-lg font-semibold">All Stocks</h3>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="hidden sm:inline">Sort by:</span>
          <button
            onClick={() => handleSort('ticker')}
            className={`px-2 py-1 rounded-md transition-colors duration-150 ${sortField === 'ticker' ? 'bg-accent-primary-glow text-accent-primary' : 'hover:bg-bg-hover'}`}
          >
            Ticker {sortField === 'ticker' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button
            onClick={() => handleSort('change')}
            className={`px-2 py-1 rounded-md transition-colors duration-150 ${sortField === 'change' ? 'bg-accent-primary-glow text-accent-primary' : 'hover:bg-bg-hover'}`}
          >
            Change {sortField === 'change' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto"
          style={{
            maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT}px`,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-border-color) transparent',
          }}
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <table className="w-full border-collapse min-w-[600px]" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <thead className="sticky top-0 z-20 bg-bg-card">
                <tr>
                  <th className="sticky left-0 z-30 bg-bg-card text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[80px]">
                    Ticker
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[160px]">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[140px] hidden sm:table-cell">
                    Sector
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[100px]">
                    Change
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[110px]">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-color min-w-[100px] hidden lg:table-cell">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: `${visibleStart * ROW_HEIGHT}px` }}><td colSpan={6} /></tr>
                {sorted.slice(visibleStart, visibleEnd).map((t) => {
                  const isBullish = t.change >= 0;
                  return (
                    <tr
                      key={t.ticker}
                      onClick={() => navigate(`/stock/${t.ticker}`)}
                      className="border-b border-border-color cursor-pointer transition-colors duration-150 hover:bg-bg-hover"
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <td className="sticky left-0 z-10 bg-bg-card px-4 py-3 font-mono text-sm">
                        <span className="font-semibold text-accent-primary">{t.ticker}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{t.name}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden sm:table-cell">{t.sector}</td>
                      <td className="px-4 py-3 font-mono text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${isBullish ? 'bg-bullish-bg text-bullish' : 'bg-bearish-bg text-bearish'}`}>
                          {formatPercent(t.change)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{formatPrice(t.latest_close)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-text-secondary hidden lg:table-cell">
                        {(t.volume || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showScrollHint && (
          <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-bg-card to-transparent pointer-events-none flex items-center justify-end pr-2">
            <ChevronRight size={16} className="text-text-muted animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-border-color text-xs text-text-secondary">
        <span>{sorted.length} stocks</span>
      </div>
    </div>
  );
}
