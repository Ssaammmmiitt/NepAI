import { useState, useEffect } from 'react';
import { getMarketOverview } from '../../services/mockData';
import { Building2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import './SectorBreakdown.css';

export function SectorBreakdown() {
  const [sectors, setSectors] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketOverview()
      .then((data) => setSectors(data.sectorBreakdown))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading sectors..." />;

  const sorted = Object.entries(sectors).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="card sector-breakdown">
      <div className="sector-header">
        <Building2 size={20} color="var(--accent-primary)" />
        <h2 className="text-heading">🏢 Sector Breakdown</h2>
      </div>
      <div className="sector-list">
        {sorted.map(([sector, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={sector} className="sector-item">
              <div className="sector-info">
                <span className="text-body">{sector}</span>
                <span className="text-caption">{count} stocks</span>
              </div>
              <div className="sector-bar">
                <div
                  className="sector-bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-price sector-pct">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
