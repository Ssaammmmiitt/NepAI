import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useStockStore } from '@/store/stockStore'
import { formatCurrency, formatPercent } from '@/utils/formatters'

const PAGE_SIZE = 15

export function TickerList() {
  const { tickers } = useStockStore()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<'ticker' | 'change' | 'volume' | 'price_high' | 'price_low'>('ticker')

  const sorted = useMemo(() => {
    const copy = [...tickers]
    switch (sort) {
      case 'change':
        return copy.sort((a, b) => b.change - a.change)
      case 'volume':
        return copy.sort((a, b) => b.volume - a.volume)
      case 'price_high':
        return copy.sort((a, b) => b.latest_close - a.latest_close)
      case 'price_low':
        return copy.sort((a, b) => a.latest_close - b.latest_close)
      default:
        return copy.sort((a, b) => a.ticker.localeCompare(b.ticker))
    }
  }, [tickers, sort])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <Card
      title="All Stocks"
      action={
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort)
            setPage(0)
          }}
          className="cursor-pointer border border-dt-border bg-dt-bg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta outline-none hover:border-dt-text"
        >
          <option value="ticker">Ticker</option>
          <option value="change">Change %</option>
          <option value="price_high">Price (High)</option>
          <option value="price_low">Price (Low)</option>
          <option value="volume">Volume</option>
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dt-border text-left">
              <th className="dt-eyebrow pb-3 pr-4">Ticker</th>
              <th className="dt-eyebrow pb-3 pr-4 text-right">Price</th>
              <th className="dt-eyebrow pb-3 pr-4 text-right">Change</th>
              <th className="dt-eyebrow pb-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s) => (
              <tr
                key={s.ticker}
                className="border-b border-dt-border last:border-0 hover:bg-dt-bg"
              >
                <td className="py-2.5 pr-4">
                  <Link
                    to={`/stock/${s.ticker}`}
                    className="cursor-pointer font-mono text-sm font-medium text-dt-text hover:text-dt-accent-bright"
                  >
                    {s.ticker}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right font-mono text-xs">{formatCurrency(s.latest_close)}</td>
                <td
                  className={`py-2.5 pr-4 text-right font-mono text-xs font-medium ${
                    s.change >= 0 ? 'text-dt-accent-bright' : 'text-dt-negative'
                  }`}
                >
                  {formatPercent(s.change)}
                </td>
                <td className="py-2.5 text-right font-mono text-xs text-dt-meta">
                  {s.volume.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta disabled:cursor-not-allowed disabled:opacity-40 hover:text-dt-text"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Prev
          </button>
          <span className="font-mono text-xs text-dt-meta">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta disabled:cursor-not-allowed disabled:opacity-40 hover:text-dt-text"
          >
            Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      ) : null}
    </Card>
  )
}
