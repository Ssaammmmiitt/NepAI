import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useStockStore } from '@/store/stockStore'
import { formatCurrency, formatPercent } from '@/utils/formatters'

function MoverList({
  title,
  stocks,
  type,
}: {
  title: string
  stocks: ReturnType<typeof useStockStore.getState>['tickers']
  type: 'gainer' | 'loser'
}) {
  return (
    <Card title={title}>
      <ul className="flex flex-col gap-1">
        {stocks.length === 0 ? (
          <li className="text-sm text-dt-meta">No data</li>
        ) : (
          stocks.map((s) => (
            <li key={s.ticker}>
              <Link
                to={`/stock/${s.ticker}`}
                className="flex cursor-pointer items-center justify-between border border-transparent px-3 py-2 hover:border-dt-border hover:bg-dt-bg"
              >
                <span className="font-mono text-sm font-medium text-dt-text">{s.ticker}</span>
                <div className="text-right">
                  <p className="font-mono text-xs text-dt-meta">{formatCurrency(s.latest_close)}</p>
                  <p
                    className={`font-mono text-xs font-semibold ${
                      type === 'gainer' ? 'text-dt-accent-bright' : 'text-dt-negative'
                    }`}
                  >
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
  const { tickers } = useStockStore()

  const gainers = [...tickers]
    .filter((t) => t.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 5)

  const losers = [...tickers]
    .filter((t) => t.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5)

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <MoverList title="Top Gainers" stocks={gainers} type="gainer" />
      <MoverList title="Top Losers" stocks={losers} type="loser" />
    </div>
  )
}
