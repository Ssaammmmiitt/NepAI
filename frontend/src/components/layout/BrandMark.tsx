import { Link, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'

interface BrandMarkProps {
  size?: 'sm' | 'md'
  subtitle?: string
  linkWhenAway?: boolean
}

export function BrandMark({ size = 'md', subtitle, linkWhenAway = true }: BrandMarkProps) {
  const { pathname } = useLocation()
  const onDashboard = pathname === '/'
  const logoSize = size === 'sm' ? 'sm' : 'md'
  const titleSize = size === 'sm' ? 'text-sm' : 'text-lg'

  const content = (
    <div className="flex items-center gap-2.5">
      <BrandLogo size={logoSize} />
      <div className="min-w-0">
        <span className={`font-mono font-bold tracking-[0.06em] text-dt-text ${titleSize}`}>
          NepAI
        </span>
        {subtitle ? <p className="truncate text-xs text-dt-meta">{subtitle}</p> : null}
      </div>
    </div>
  )

  if (linkWhenAway && !onDashboard) {
    return (
      <Link to="/" className="cursor-pointer hover:opacity-80" aria-label="Go to dashboard">
        {content}
      </Link>
    )
  }

  return content
}
