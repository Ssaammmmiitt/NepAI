import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickers } from '../../services/mockData';
import type { StockTicker } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';
import './TickerList.css';

export function TickerList() {
  const [tickers, setTickers] = useState<StockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'ticker' | 'change'>('ticker');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    getTickers().then((data) => {
      setTickers(data);
      setLoading(false);
    });
  }, []);

  const handleSort = (field: 'ticker' | 'change') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...tickers].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'ticker') return mult * a.ticker.localeCompare(b.ticker);
    return mult * (a.change - b.change);
  });

  if (loading) return <Spinner label="Loading tickers..." />;

  return (
    <div className="card ticker-list">
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('ticker')} className="sortable">
              Ticker {sortField === 'ticker' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th>Name</th>
            <th>Sector</th>
            <th onClick={() => handleSort('change')} className="sortable">
              Change {sortField === 'change' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const isBullish = t.change >= 0;
            return (
              <tr key={t.ticker} onClick={() => navigate(`/stock/${t.ticker}`)} className="ticker-row">
                <td className="text-price">{t.ticker}</td>
                <td>{t.name}</td>
                <td className="text-caption">{t.sector}</td>
                <td className={`text-price ${isBullish ? 'text-bullish' : 'text-bearish'}`}>
                  {formatPercent(t.change)}
                </td>
                <td className="text-price">{formatPrice(t.latest_close)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
