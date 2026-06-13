import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { PortfolioHolding } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/formatters'

interface PortfolioCardProps {
  holding: PortfolioHolding
  onRemove: (ticker: string) => void
  removing?: boolean
}

export function PortfolioCard({ holding, onRemove, removing }: PortfolioCardProps) {
  const isPositive = holding.pnl >= 0

  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/stock/${holding.ticker}`}
            className="cursor-pointer font-mono text-base font-semibold text-dt-text hover:text-dt-accent-bright"
          >
            {holding.ticker}
          </Link>
          <p className="mt-0.5 text-xs text-dt-meta">
            {holding.quantity} shares @ {formatCurrency(holding.entry_price)}
          </p>
        </div>
        <Button
          variant="ghost"
          className="group !min-h-0 !px-2 !py-1.5 hover:no-underline border border-transparent hover:border-dt-negative hover:bg-dt-negative/10 hover:shadow-[2px_2px_0_0_var(--dt-negative)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0"
          onClick={() => onRemove(holding.ticker)}
          loading={removing}
          aria-label={`Remove ${holding.ticker}`}
        >
          <Trash2
            className="h-3.5 w-3.5 text-dt-negative group-hover:text-dt-negative"
            strokeWidth={1.5}
          />
        </Button>
      </div>

      <div className="mt-3 flex items-end justify-between border-t border-dt-border pt-3">
        <div>
          <p className="dt-eyebrow">Current</p>
          <p className="font-mono text-sm font-medium text-dt-text">
            {formatCurrency(holding.current_price)}
          </p>
        </div>
        <div className="text-right">
          <p className="dt-eyebrow">P&L</p>
          <p
            className={`font-mono text-sm font-medium ${
              isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
            }`}
          >
            {formatCurrency(holding.pnl)} ({formatPercent(holding.pnl_percent)})
          </p>
        </div>
      </div>
    </Card>
  )
}
