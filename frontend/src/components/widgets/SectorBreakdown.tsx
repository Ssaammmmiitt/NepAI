import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useStockStore } from '@/store/stockStore'

export function SectorBreakdown() {
  const { tickers } = useStockStore()

  const gainers = tickers.filter((t) => t.change > 0).length
  const losers = tickers.filter((t) => t.change < 0).length
  const neutral = tickers.filter((t) => t.change === 0).length
  const total = tickers.length || 1

  const segments = [
    {
      label: 'Gainers',
      count: gainers,
      color: 'bg-dt-accent-bright',
      pct: (gainers / total) * 100,
      href: '/gainers',
    },
    {
      label: 'Losers',
      count: losers,
      color: 'bg-dt-negative',
      pct: (losers / total) * 100,
      href: '/losers',
    },
    {
      label: 'Unchanged',
      count: neutral,
      color: 'bg-dt-meta',
      pct: (neutral / total) * 100,
      href: null,
    },
  ]

  return (
    <Card title="Market Sentiment" className="h-fit w-full self-start">
      <div className="mb-5 flex h-2 overflow-hidden border border-dt-border bg-dt-bg">
        {segments.map(
          (s) =>
            s.count > 0 && (
              <div
                key={s.label}
                className={s.color}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.count}`}
              />
            ),
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {segments.map((s) => {
          const isLink = s.href && s.count > 0

          const row = (
            <>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 ${s.color}`} />
                <span className="text-dt-meta">{s.label}</span>
              </div>
              <span className="font-mono text-sm font-medium text-dt-text">
                {s.count} <span className="text-dt-meta">({s.pct.toFixed(0)}%)</span>
              </span>
            </>
          )

          return (
            <li key={s.label}>
              {isLink ? (
                <Link
                  to={s.href}
                  className="flex cursor-pointer items-center justify-between text-sm px-1 py-0.5 -mx-1 transition-colors hover:bg-dt-bg"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-center justify-between text-sm">{row}</div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
