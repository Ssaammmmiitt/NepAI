import { Link, useLocation } from 'react-router-dom'
import { Activity, BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useStockStore } from '@/store/stockStore'
import { formatCompact } from '@/utils/formatters'
import { useRowEntrance } from '@/hooks/useAnimations'

type MoverType = 'gainer' | 'loser'

interface MarketOverviewProps {
  activeMover?: MoverType
}

export function MarketOverview({ activeMover }: MarketOverviewProps) {
  const { tickers, loading } = useStockStore()
  const location = useLocation()
  const ready = !loading || tickers.length > 0
  const containerRef = useRowEntrance('[data-animate]', { enabled: ready })
  const isDashboard = location.pathname === '/'

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

  const stats: Array<{
    label: string
    value: string
    icon: LucideIcon
    color: string
    moverType?: MoverType
    href?: string
    dashboardLink?: boolean
  }> = [
    {
      label: 'Listed',
      value: tickers.length.toString(),
      icon: BarChart3,
      color: 'text-dt-accent',
      href: '/',
      dashboardLink: true,
    },
    {
      label: 'Gainers',
      value: gainers.toString(),
      icon: TrendingUp,
      color: 'text-dt-accent-bright',
      moverType: 'gainer',
      href: '/gainers',
    },
    {
      label: 'Losers',
      value: losers.toString(),
      icon: TrendingDown,
      color: 'text-dt-negative',
      moverType: 'loser',
      href: '/losers',
    },
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
      {stats.map(({ label, value, icon: Icon, color, moverType, href, dashboardLink }) => {
        const isMoverActive = moverType !== undefined && moverType === activeMover
        const isListedActive = dashboardLink === true && isDashboard
        const isActive = isMoverActive || isListedActive
        const isMoverLink = href && moverType && parseInt(value, 10) > 0 && !isMoverActive
        const isListedLink = dashboardLink && href && !isDashboard
        const isLink = isMoverLink || isListedLink

        const content = (
          <div className="flex items-start justify-between">
            <div>
              <p className="dt-eyebrow">{label}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-dt-text">{value}</p>
            </div>
            <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
          </div>
        )

        return (
          <div key={label} data-animate>
            {isLink ? (
              <Link
                to={href}
                className="dt-card block w-full cursor-pointer !p-4 transition-colors hover:border-dt-text hover:shadow-[4px_4px_0_0_var(--dt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                {content}
              </Link>
            ) : (
              <Card
                className={`!p-4 ${isActive ? 'border-dt-accent-bright bg-dt-accent-bright/5' : ''}`}
              >
                {content}
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
}
