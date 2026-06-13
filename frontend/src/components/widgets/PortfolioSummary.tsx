import { Card } from '@/components/ui/Card'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { useRowEntrance } from '@/hooks/useAnimations'

interface PortfolioSummaryProps {
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  holdingsCount: number
}

export function PortfolioSummary({
  totalValue,
  totalPnl,
  totalPnlPercent,
  holdingsCount,
}: PortfolioSummaryProps) {
  const isPositive = totalPnl >= 0
  const containerRef = useRowEntrance('[data-animate]')

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="!border-dt-border-strong !bg-dt-bg !p-4" data-animate>
        <p className="dt-eyebrow">Portfolio Value</p>
        <p className="mt-1 font-mono text-xl font-bold text-dt-text">{formatCurrency(totalValue)}</p>
      </Card>
      <Card className="!border-dt-border-strong !bg-dt-bg !p-4" data-animate>
        <p className="dt-eyebrow">Total P&L</p>
        <p
          className={`mt-1 font-mono text-xl font-bold ${
            isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
          }`}
        >
          {formatCurrency(totalPnl)}
        </p>
        <p
          className={`font-mono text-xs font-medium ${
            isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
          }`}
        >
          {formatPercent(totalPnlPercent)}
        </p>
      </Card>
      <Card className="!border-dt-border-strong !bg-dt-bg !p-4" data-animate>
        <p className="dt-eyebrow">Holdings</p>
        <p className="mt-1 font-mono text-xl font-bold text-dt-text">{holdingsCount}</p>
      </Card>
    </div>
  )
}
