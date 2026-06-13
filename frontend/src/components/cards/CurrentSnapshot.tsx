import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import type { StockSummary } from '@/types'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'

interface CurrentSnapshotProps {
  summary: StockSummary | null
  loading?: boolean
}

export function CurrentSnapshot({ summary, loading }: CurrentSnapshotProps) {
  if (loading || !summary) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner />
      </Card>
    )
  }

  const isPositive = summary.change >= 0

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="dt-eyebrow">{summary.ticker}</p>
          {summary.stock_name ? (
            <p className="mt-0.5 text-xs text-dt-meta">{summary.stock_name}</p>
          ) : null}
          <p className="mt-1 font-mono text-2xl font-bold text-dt-text sm:text-3xl">
            {formatCurrency(summary.latest_close)}
          </p>
          <p
            className={`mt-1 font-mono text-sm font-semibold ${
              isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
            }`}
          >
            {formatPercent(summary.change)}
          </p>
        </div>
        <div className="text-right">
          {summary.stock_sector ? (
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-accent">
              {summary.stock_sector}
            </p>
          ) : null}
          <p className="text-xs text-dt-meta">As of {formatDate(summary.latest_date)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-dt-border pt-4">
        <div>
          <p className="dt-eyebrow">52W High</p>
          <p className="font-mono text-sm font-medium text-dt-text">{formatCurrency(summary.high_52w)}</p>
        </div>
        <div>
          <p className="dt-eyebrow">52W Low</p>
          <p className="font-mono text-sm font-medium text-dt-text">{formatCurrency(summary.low_52w)}</p>
        </div>
        <div>
          <p className="dt-eyebrow">Avg Volume</p>
          <p className="font-mono text-sm font-medium text-dt-text">
            {summary.avg_volume.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="dt-eyebrow">Data Points</p>
          <p className="font-mono text-sm font-medium text-dt-text">
            {summary.total_rows.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  )
}
