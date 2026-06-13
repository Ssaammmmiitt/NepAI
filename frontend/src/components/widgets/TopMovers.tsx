import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useStockStore } from '@/store/stockStore'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { useRowEntrance } from '@/hooks/useAnimations'

type MoverType = 'gainer' | 'loser'

interface TopMoversPanelProps {
  type: MoverType
  compact?: boolean
  className?: string
}

export function TopMoversPanel({ type, compact = false, className = '' }: TopMoversPanelProps) {
  const { tickers } = useStockStore()

  const stocks = [...tickers]
    .filter((t) => (type === 'gainer' ? t.change > 0 : t.change < 0))
    .sort((a, b) => (type === 'gainer' ? b.change - a.change : a.change - b.change))
    .slice(0, 5)

  const title = type === 'gainer' ? 'Top Gainers' : 'Top Losers'
  const changeColor = type === 'gainer' ? 'text-dt-accent-bright' : 'text-dt-negative'

  return (
    <Card title={title} className={`h-fit w-full self-start ${compact ? '!p-3' : ''} ${className}`}>
      <ul className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'}`}>
        {stocks.length === 0 ? (
          <li className="text-sm text-dt-meta">No data</li>
        ) : (
          stocks.map((s) => (
            <li key={s.ticker}>
              <Link
                to={`/stock/${s.ticker}`}
                className={`flex cursor-pointer items-center justify-between border border-transparent hover:border-dt-border hover:bg-dt-bg ${
                  compact ? 'px-2 py-1.5' : 'px-3 py-2'
                }`}
              >
                <span
                  className={`font-mono font-medium text-dt-text ${
                    compact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  {s.ticker}
                </span>
                <div className="text-right">
                  <p className={`font-mono text-dt-meta ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {formatCurrency(s.latest_close)}
                  </p>
                  <p className={`font-mono font-semibold ${changeColor} ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {formatPercent(s.change)}
                  </p>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </Card>
  )
}

export function TopMovers() {
  const containerRef = useRowEntrance('[data-animate]')

  return (
    <div ref={containerRef} className="grid gap-3 md:grid-cols-2">
      <div data-animate>
        <TopMoversPanel type="gainer" />
      </div>
      <div data-animate>
        <TopMoversPanel type="loser" />
      </div>
    </div>
  )
}
