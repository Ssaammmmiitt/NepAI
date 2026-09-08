import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { useWatchlistData } from '@/hooks/useWatchlistData'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useStockStore } from '@/store/stockStore'
import { formatNumber, formatPercent } from '@/utils/formatters'

interface WatchlistRowProps {
  ticker: string
}

export function WatchlistRow({ ticker }: WatchlistRowProps) {
  const navigate = useNavigate()
  const { ohlc30d, loading } = useWatchlistData(ticker)
  const removeTicker = useWatchlistStore((s) => s.removeTicker)
  const stockData = useStockStore((s) => s.tickers.find((t) => t.ticker === ticker))

  const isPositive = (stockData?.change ?? 0) >= 0

  return (
    <div
      onClick={() => navigate(`/stock/${ticker}`)}
      className="group flex cursor-pointer items-center gap-4 border border-dt-border bg-dt-surface p-4 transition-colors hover:bg-dt-bg sm:p-5"
    >
      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-dt-text sm:text-base">
          {ticker}
        </p>
        {stockData?.stock_name && (
          <p className="truncate text-[10px] text-dt-meta">{stockData.stock_name}</p>
        )}
      </div>

      {/* Price + change */}
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold text-dt-text">
          {stockData ? formatNumber(stockData.latest_close) : '—'}
        </p>
        {stockData && (
          <p
            className={`font-mono text-[10px] font-semibold ${
              isPositive ? 'text-dt-positive' : 'text-dt-negative'
            }`}
          >
            {formatPercent(stockData.change)}
          </p>
        )}
      </div>

      {/* Sparkline */}
      <div className="w-24 shrink-0 sm:w-32 flex items-center justify-center">
        {loading ? (
          <div className="h-[60px] w-full animate-pulse bg-dt-border" />
        ) : ohlc30d.length === 0 ? (
          <span className="font-mono text-[10px] text-dt-meta">No data</span>
        ) : (
          <SparklineChart
            data={ohlc30d}
            height={60}
            color={isPositive ? '#10B981' : '#EF5350'}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Remove ${ticker} from watchlist`}
          onClick={(e) => {
            e.stopPropagation()
            removeTicker(ticker)
          }}
          className="group flex h-8 w-8 items-center justify-center border border-transparent transition-all hover:border-dt-negative hover:bg-dt-negative/10 hover:shadow-[2px_2px_0_0_var(--dt-negative)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <X className="h-4 w-4 text-dt-meta group-hover:text-dt-negative" strokeWidth={3.5} />
        </button>
      </div>
    </div>
  )
}
