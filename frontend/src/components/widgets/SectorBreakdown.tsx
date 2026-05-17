import { useState, useEffect } from 'react';
import { getMarketOverview } from '../../services/mockData';
import { Building2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

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
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Building2 size={20} color="var(--color-accent-primary)" />
        <h2 className="text-xl font-semibold">🏢 Sector Breakdown</h2>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.map(([sector, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={sector} className="flex items-center gap-4">
              <div className="flex flex-col min-w-[160px]">
                <span className="text-sm">{sector}</span>
                <span className="text-xs text-text-secondary">{count} stocks</span>
              </div>
              <div className="flex-1 h-2 bg-bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono text-xs min-w-[48px] text-right">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
