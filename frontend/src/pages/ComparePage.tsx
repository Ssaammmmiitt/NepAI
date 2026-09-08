import { useState } from 'react'
import { GitCompare, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CompareChart } from '@/components/charts/CompareChart'
import { CompareTable } from '@/components/cards/CompareTable'
import { StockSearch } from '@/components/widgets/StockSearch'
import { Button } from '@/components/ui/Button'
import { useCompareData } from '@/hooks/useCompareData'
import { useWatchlistStore } from '@/store/watchlistStore'
import { usePageEntrance } from '@/hooks/useAnimations'

type Period = '7D' | '30D' | '90D' | '1Y' | 'All'
const PERIODS: Period[] = ['7D', '30D', '90D', '1Y', 'All']
const MAX_STOCKS = 5

export function ComparePage() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [period, setPeriod] = useState<Period>('90D')
  const watchlistTickers = useWatchlistStore((s) => s.tickers)

  const { entries, loading, error } = useCompareData(selectedTickers, period)

  const addTicker = (ticker: string) => {
    const upper = ticker.toUpperCase()
    setSelectedTickers((prev) =>
      prev.includes(upper) || prev.length >= MAX_STOCKS ? prev : [...prev, upper],
    )
  }

  const removeTicker = (ticker: string) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== ticker))
  }

  const seedFromWatchlist = () => {
    setSelectedTickers(watchlistTickers.slice(0, MAX_STOCKS))
  }

  const containerRef = usePageEntrance('[data-section]', { enabled: selectedTickers.length >= 2 })

  return (
    <>
      <Header
        title="Compare"
        subtitle="Overlay up to 5 stocks · normalised to % change from start of period"
      />

      <PageWrapper>
        <div ref={containerRef} className="flex flex-col gap-4 lg:gap-6">

          {/* Stock picker */}
          <div data-section className="border border-dt-border bg-dt-surface p-4">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-meta">
              Select stocks ({selectedTickers.length}/{MAX_STOCKS})
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <StockSearch
                onSelect={addTicker}
                placeholder="Add stock to compare..."
              />
              {watchlistTickers.length > 0 && (
                <Button variant="secondary" onClick={seedFromWatchlist}>
                  Seed from watchlist
                </Button>
              )}
            </div>

            {/* Selected ticker pills */}
            {selectedTickers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTickers.map((ticker) => (
                  <span
                    key={ticker}
                    className="flex items-center gap-1.5 border border-dt-border bg-dt-bg px-2.5 py-1 font-mono text-xs"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: entries.find((e) => e.ticker === ticker)?.color ?? '#10B981' }}
                    />
                    {ticker}
                    <button
                      type="button"
                      onClick={() => removeTicker(ticker)}
                      aria-label={`Remove ${ticker}`}
                      className="ml-0.5 text-dt-meta hover:text-dt-negative"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {selectedTickers.length > 0 && selectedTickers.length < 2 && (
              <p className="mt-2 font-mono text-[10px] text-dt-meta">
                Select at least 2 stocks to see the comparison chart.
              </p>
            )}
          </div>

          {/* Period picker */}
          <div data-section className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                  period === p
                    ? 'border-dt-accent-bright bg-dt-accent-bright/10 text-dt-accent-bright'
                    : 'border-dt-border text-dt-meta hover:border-dt-text hover:text-dt-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          {selectedTickers.length >= 2 && (
            <div data-section className="border border-dt-border bg-dt-surface">
              <div className="border-b border-dt-border px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-meta">
                  Normalised price (base 100)
                </p>
              </div>

              {/* Legend */}
              {entries.length > 0 && (
                <div className="flex flex-wrap gap-3 px-4 pt-3">
                  {entries.map((e) => (
                    <span key={e.ticker} className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: e.color }}
                      />
                      <span className="text-dt-text">{e.ticker}</span>
                      {e.normalised.at(-1) && (
                        <span className="text-dt-meta">
                          {e.normalised.at(-1)!.value.toFixed(1)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              <div className="p-4">
                {loading ? (
                  <div className="flex h-[360px] items-center justify-center">
                    <div className="font-mono text-xs text-dt-meta animate-pulse">Loading chart data…</div>
                  </div>
                ) : error ? (
                  <div className="flex h-[360px] items-center justify-center">
                    <p className="font-mono text-xs text-dt-negative">{error}</p>
                  </div>
                ) : (
                  <CompareChart entries={entries} height={360} />
                )}
              </div>
            </div>
          )}

          {/* Metrics table */}
          {selectedTickers.length >= 2 && (
            <div data-section className="border border-dt-border bg-dt-surface">
              <div className="border-b border-dt-border px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-meta">
                  Key metrics
                </p>
              </div>
              <CompareTable entries={entries} loading={loading} />
            </div>
          )}

          {/* No stocks empty state */}
          {selectedTickers.length === 0 && (
            <div
              data-section
              className="flex flex-col items-center justify-center gap-3 border border-dt-border bg-dt-surface px-8 py-16 text-center"
            >
              <GitCompare className="h-10 w-10 text-dt-meta" strokeWidth={1} />
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.06em] text-dt-text">
                No stocks selected
              </p>
              <p className="text-xs text-dt-meta">
                Search for 2–5 stocks above to overlay their price movements.
              </p>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
