import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MarketOverview } from '@/components/widgets/MarketOverview'
import { TopMovers } from '@/components/widgets/TopMovers'
import { SectorBreakdown } from '@/components/widgets/SectorBreakdown'
import { TickerList } from '@/components/widgets/TickerList'
import { StockSearch } from '@/components/widgets/StockSearch'
import { useStockStore } from '@/store/stockStore'
import { useStaggerEntrance } from '@/hooks/useAnimations'

export function Dashboard() {
  const { loadTickers } = useStockStore()
  const containerRef = useStaggerEntrance('[data-section]', { stagger: 0.12, y: 16 })

  useEffect(() => {
    void loadTickers()
  }, [loadTickers])

  return (
    <div className="flex-1">
      <Header title="Dashboard" subtitle="NEPSE Market Overview" action={<StockSearch />} />
      <PageWrapper>
        <div ref={containerRef} className="flex flex-col gap-4 sm:gap-5">
          <div data-section>
            <MarketOverview />
          </div>
          <div data-section>
            <TopMovers />
          </div>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3" data-section>
            <div className="min-w-0 lg:col-span-2">
              <TickerList />
            </div>
            <SectorBreakdown />
          </div>
        </div>
      </PageWrapper>
    </div>
  )
}
