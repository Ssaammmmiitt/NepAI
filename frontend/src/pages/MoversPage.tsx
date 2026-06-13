import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MarketOverview } from '@/components/widgets/MarketOverview'
import { TopMoversPanel } from '@/components/widgets/TopMovers'
import { MoversList } from '@/components/widgets/MoversList'
import { StockSearch } from '@/components/widgets/StockSearch'
import { useStockStore } from '@/store/stockStore'
import { usePageEntrance, useRowEntrance } from '@/hooks/useAnimations'

type MoverType = 'gainer' | 'loser'

const pageMeta: Record<MoverType, { title: string; subtitle: string }> = {
  gainer: {
    title: 'Market Gainers',
    subtitle: 'Full list of stocks up today',
  },
  loser: {
    title: 'Market Losers',
    subtitle: 'Full list of stocks down today',
  },
}

interface MoversPageProps {
  type: MoverType
}

export function MoversPage({ type }: MoversPageProps) {
  const { loadTickers } = useStockStore()
  const containerRef = usePageEntrance('[data-section]')
  const gridRef = useRowEntrance('[data-animate]')
  const { title, subtitle } = pageMeta[type]

  useEffect(() => {
    void loadTickers()
  }, [loadTickers])

  return (
    <div className="flex-1">
      <Header title={title} subtitle={subtitle} action={<StockSearch />} />
      <PageWrapper>
        <div ref={containerRef} className="flex flex-col gap-4 sm:gap-5">
          <div data-section>
            <MarketOverview activeMover={type} />
          </div>
          <div
            ref={gridRef}
            data-section
            className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] xl:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div data-animate>
              <MoversList type={type} />
            </div>
            <div data-animate>
              <TopMoversPanel type={type} compact />
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  )
}
