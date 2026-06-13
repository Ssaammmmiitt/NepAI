import { Link } from 'react-router-dom'
import type { StockTicker } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/formatters'

interface StockSummaryCardProps {
  stock: StockTicker
}

export function StockSummaryCard({ stock }: StockSummaryCardProps) {
  const isPositive = stock.change >= 0

  return (
    <Link
      to={`/stock/${stock.ticker}`}
      className="flex cursor-pointer items-center justify-between border border-dt-border bg-dt-surface p-4 hover:border-dt-accent-bright hover:shadow-[4px_4px_0_0_var(--dt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5"
    >
      <span className="font-mono text-sm font-semibold text-dt-text">{stock.ticker}</span>
      <div className="text-right">
        <p className="font-mono text-sm text-dt-text">{formatCurrency(stock.latest_close)}</p>
        <p
          className={`font-mono text-xs font-semibold ${
            isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
          }`}
        >
          {formatPercent(stock.change)}
        </p>
      </div>
    </Link>
  )
}
