import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import {
  StockTickerTooltip,
  TruncatedSectorTooltip,
} from '@/components/widgets/StockTickerTooltip'
import { useStockStore } from '@/store/stockStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency, formatPercent } from '@/utils/formatters'

type MoverType = 'gainer' | 'loser'
type SortKey = 'change' | 'ticker' | 'volume'

interface MoversListProps {
  type: MoverType
}

const meta: Record<MoverType, { title: string; description: string; empty: string }> = {
  gainer: {
    title: 'All Gainers',
    description: 'Every stock up today · sorted by performance',
    empty: 'No gainers today',
  },
  loser: {
    title: 'All Losers',
    description: 'Every stock down today · sorted by performance',
    empty: 'No losers today',
  },
}

export function MoversList({ type }: MoversListProps) {
  const { tickers } = useStockStore()
  const isSmUp = useMediaQuery('(min-width: 640px)')
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

  const { title, description, empty } = meta[type]
  const changeColor = type === 'gainer' ? 'text-dt-accent-bright' : 'text-dt-negative'

  return (
    <Card
      title={title}
      description={`${stocks.length} stocks · ${description}`}
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
        <p className="text-sm text-dt-meta">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dt-border text-left">
                <th className="dt-eyebrow pb-3 pr-4">Ticker</th>
                <th className="dt-eyebrow hidden pb-3 pr-4 sm:table-cell">Sector</th>
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
                  <td className="max-w-[8rem] py-2.5 pr-4 sm:max-w-[10rem]">
                    <StockTickerTooltip
                      stockName={s.stock_name}
                      stockSector={s.stock_sector}
                      showSector={!isSmUp}
                    >
                      <Link
                        to={`/stock/${s.ticker}`}
                        className="cursor-pointer font-mono text-sm font-medium text-dt-text hover:text-dt-accent-bright"
                      >
                        {s.ticker}
                      </Link>
                    </StockTickerTooltip>
                  </td>
                  <td className="hidden max-w-[9rem] py-2.5 pr-4 sm:table-cell">
                    {s.stock_sector ? (
                      <TruncatedSectorTooltip sector={s.stock_sector} />
                    ) : (
                      <span className="text-xs text-dt-meta">—</span>
                    )}
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
