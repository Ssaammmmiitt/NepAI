import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useStockStore } from '@/store/stockStore'
import { formatCurrency, formatPercent } from '@/utils/formatters'

type MoverType = 'gainer' | 'loser'
type SortKey = 'change' | 'ticker' | 'volume'

interface MoversListProps {
  type: MoverType
}

export function MoversList({ type }: MoversListProps) {
  const { tickers } = useStockStore()
  const [sort, setSort] = useState<SortKey>('change')

  const stocks = useMemo(() => {
    const filtered = tickers.filter((t) => (type === 'gainer' ? t.change > 0 : t.change < 0))
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'ticker':
          return a.ticker.localeCompare(b.ticker)
        case 'volume':
          return b.volume - a.volume
        default:
          return type === 'gainer' ? b.change - a.change : a.change - b.change
      }
    })
  }, [tickers, type, sort])

  const title = type === 'gainer' ? `All Gainers (${stocks.length})` : `All Losers (${stocks.length})`
  const changeColor = type === 'gainer' ? 'text-dt-accent-bright' : 'text-dt-negative'

  return (
    <Card
      title={title}
      action={
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="cursor-pointer border border-dt-border bg-dt-bg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta outline-none hover:border-dt-text"
        >
          <option value="change">Change %</option>
          <option value="ticker">Ticker</option>
          <option value="volume">Volume</option>
        </select>
      }
    >
      {stocks.length === 0 ? (
        <p className="text-sm text-dt-meta">No {type === 'gainer' ? 'gainers' : 'losers'} today</p>
      ) : (
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
              {stocks.map((s) => (
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
                  <td className="py-2.5 pr-4 text-right font-mono text-xs text-dt-text">
                    {formatCurrency(s.latest_close)}
                  </td>
                  <td className={`py-2.5 pr-4 text-right font-mono text-xs font-medium ${changeColor}`}>
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
      )}
    </Card>
  )
}
