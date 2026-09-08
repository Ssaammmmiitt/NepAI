import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { WatchlistRow } from '@/components/cards/WatchlistRow'
import { StockSearch } from '@/components/widgets/StockSearch'
import { Button } from '@/components/ui/Button'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useStockStore } from '@/store/stockStore'
import { usePageEntrance } from '@/hooks/useAnimations'

const REFRESH_MS = 5 * 60 * 1000

export function WatchlistPage() {
  const navigate = useNavigate()
  const { tickers, addTicker } = useWatchlistStore()
  const { loadTickers } = useStockStore()

  // Initial load + 5-min auto-refresh
  useEffect(() => {
    void loadTickers()
    const id = setInterval(() => void loadTickers(true), REFRESH_MS)
    return () => clearInterval(id)
  }, [loadTickers])

  const containerRef = usePageEntrance('[data-section]', { enabled: tickers.length > 0 })

  return (
    <>
      <Header
        title="Watchlist"
        subtitle={`${tickers.length} stock${tickers.length === 1 ? '' : 's'} tracked`}
        action={
          <StockSearch
            onSelect={(ticker) => addTicker(ticker)}
            placeholder="Add ticker to watchlist..."
          />
        }
      />

      <PageWrapper>
        {tickers.length === 0 ? (
          /* Empty state */
          <div
            data-section
            className="flex flex-col items-center justify-center gap-4 border border-dt-border bg-dt-surface px-8 py-16 text-center"
          >
            <Bookmark className="h-10 w-10 text-dt-meta" strokeWidth={1} />
            <div>
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.06em] text-dt-text">
                No stocks tracked yet
              </p>
              <p className="mt-1 text-xs text-dt-meta">
                Use the search above to add up to 20 stocks to your watchlist.
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Browse stocks
            </Button>
          </div>
        ) : (
          <div
            ref={containerRef}
            data-section
            className="flex flex-col gap-3"
          >
            {tickers.map((ticker) => (
              <div key={ticker} className="bg-dt-bg">
                <WatchlistRow ticker={ticker} />
              </div>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
