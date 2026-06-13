import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import type { StockSummary } from '@/types'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'

interface CurrentSnapshotProps {
  summary: StockSummary | null
  loading?: boolean
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="dt-eyebrow truncate">{label}</p>
      <p className="truncate font-mono text-sm font-medium tabular-nums text-dt-text" title={value}>
        {value}
      </p>
    </div>
  )
}

export function CurrentSnapshot({ summary, loading }: CurrentSnapshotProps) {
  if (loading || !summary) {
    return (
      <Card className="flex min-w-0 w-full items-center justify-center py-12">
        <Spinner />
      </Card>
    )
  }

  const isPositive = summary.change >= 0
  const price = formatCurrency(summary.latest_close)
  const change = formatPercent(summary.change)

  return (
    <Card className="min-w-0 w-full overflow-hidden">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="dt-eyebrow shrink-0">{summary.ticker}</p>
        {summary.stock_sector ? (
          <p
            className="min-w-0 max-w-[58%] truncate text-right font-mono text-[10px] uppercase tracking-[0.06em] text-dt-accent"
            title={summary.stock_sector}
          >
            {summary.stock_sector}
          </p>
        ) : null}
      </div>

      {summary.stock_name ? (
        <p
          className="mt-1 line-clamp-2 break-words text-xs leading-snug text-dt-meta"
          title={summary.stock_name}
        >
          {summary.stock_name}
        </p>
      ) : null}

      <div className="mt-3 min-w-0">
        <p
          className="truncate font-mono text-2xl font-bold tabular-nums text-dt-text sm:text-3xl lg:text-2xl xl:text-3xl"
          title={price}
        >
          {price}
        </p>
        <p
          className={`mt-1 truncate font-mono text-sm font-semibold tabular-nums ${
            isPositive ? 'text-dt-accent-bright' : 'text-dt-negative'
          }`}
        >
          {change}
        </p>
        <p className="mt-1 truncate text-xs text-dt-meta">
          As of {formatDate(summary.latest_date)}
        </p>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 border-t border-dt-border pt-4">
        <StatCell label="52W High" value={formatCurrency(summary.high_52w)} />
        <StatCell label="52W Low" value={formatCurrency(summary.low_52w)} />
        <StatCell label="Avg Volume" value={summary.avg_volume.toLocaleString()} />
        <StatCell label="Data Points" value={summary.total_rows.toLocaleString()} />
      </div>
    </Card>
  )
}
