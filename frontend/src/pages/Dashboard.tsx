import { useEffect } from 'react';
import { TopMovers } from '../components/widgets/TopMovers';
import { TickerList } from '../components/widgets/TickerList';
import { MarketOverview } from '../components/widgets/MarketOverview';
import { SectorBreakdown } from '../components/widgets/SectorBreakdown';
import { LiveClock } from '../components/widgets/LiveClock';
import { Header } from '../components/layout/Header';
import { useStockStore } from '../store/stockStore';

export default function Dashboard() {
  const loadTickers = useStockStore((s) => s.loadTickers);

  useEffect(() => {
    loadTickers();
  }, [loadTickers]);

  return (
    <>
      <Header title="Dashboard" subtitle="NEPSE Market Overview" rightSlot={<LiveClock />} />
      <div className="flex flex-col gap-8">
        <MarketOverview />
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
