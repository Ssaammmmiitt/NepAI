import { useEffect } from 'react';
import { TopMovers } from '../components/widgets/TopMovers';
import { TickerList } from '../components/widgets/TickerList';
import { MarketOverview } from '../components/widgets/MarketOverview';
import { SectorBreakdown } from '../components/widgets/SectorBreakdown';
import { LiveClock } from '../components/widgets/LiveClock';
import { Header } from '../components/layout/Header';
import { useStockStore } from '../store/stockStore';
import './Dashboard.css';

export default function Dashboard() {
  const loadTickers = useStockStore((s) => s.loadTickers);

  useEffect(() => {
    loadTickers();
  }, [loadTickers]);

  return (
    <>
      <Header title="Dashboard" subtitle="NEPSE Market Overview" rightSlot={<LiveClock />} />
      <div className="dashboard-content">
        <MarketOverview />
        <div className="dashboard-grid">
          <div className="dashboard-movers">
            <TopMovers type="gainers" />
            <TopMovers type="losers" />
          </div>
          <SectorBreakdown />
        </div>
        <TickerList />
      </div>
    </>
  );
}
