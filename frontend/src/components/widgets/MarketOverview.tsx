import { Activity, BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useStockStore } from '@/store/stockStore'
import { formatCompact } from '@/utils/formatters'
import { useStaggerEntrance } from '@/hooks/useAnimations'

export function MarketOverview() {
  const { tickers, loading } = useStockStore()
  const ready = !loading || tickers.length > 0
  const containerRef = useStaggerEntrance('[data-animate]', { enabled: ready })

  const gainers = tickers.filter((t) => t.change > 0).length
  const losers = tickers.filter((t) => t.change < 0).length
  const totalVolume = tickers.reduce((sum, t) => sum + t.volume, 0)
  const avgChange =
    tickers.length > 0
      ? tickers.reduce((sum, t) => sum + t.change, 0) / tickers.length
      : 0

  if (loading && tickers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const stats = [
    { label: 'Listed', value: tickers.length.toString(), icon: BarChart3, color: 'text-dt-accent' },
    { label: 'Gainers', value: gainers.toString(), icon: TrendingUp, color: 'text-dt-accent-bright' },
    { label: 'Losers', value: losers.toString(), icon: TrendingDown, color: 'text-dt-negative' },
    { label: 'Volume', value: formatCompact(totalVolume), icon: Activity, color: 'text-dt-text' },
    {
      label: 'Avg Chg',
      value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`,
      icon: TrendingUp,
      color: avgChange >= 0 ? 'text-dt-accent-bright' : 'text-dt-negative',
    },
  ]

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} data-animate>
          <Card className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="dt-eyebrow">{label}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-dt-text">{value}</p>
              </div>
              <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}
