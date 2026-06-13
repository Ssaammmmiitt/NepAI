import { useRef, useState, type ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

interface StockTickerTooltipProps {
  stockName?: string | null
  stockSector?: string | null
  /** Show sector in tooltip (use when the sector column is hidden). */
  showSector?: boolean
  children: ReactNode
  className?: string
}

export function StockTickerTooltip({
  stockName,
  stockSector,
  showSector = false,
  children,
  className = '',
}: StockTickerTooltipProps) {
  const lines: string[] = []
  if (stockName) lines.push(stockName)
  if (showSector && stockSector) lines.push(stockSector)

  const content =
    lines.length > 0 ? (
      <div className="flex flex-col gap-0.5">
        {lines.map((line, i) => (
          <p
            key={line}
            className={`leading-snug ${i === 0 ? 'font-mono text-xs font-medium text-dt-text' : 'text-[10px] uppercase tracking-[0.06em] text-dt-meta'}`}
          >
            {line}
          </p>
        ))}
      </div>
    ) : null

  return (
    <Tooltip content={content} disabled={!content} className={className}>
      {children}
    </Tooltip>
  )
}

interface TruncatedSectorTooltipProps {
  sector: string
  className?: string
}

/** Tooltip for sector cells — only appears when text is truncated. */
export function TruncatedSectorTooltip({ sector, className = '' }: TruncatedSectorTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)

  const checkTruncation = () => {
    const el = ref.current
    if (el) setTruncated(el.scrollWidth > el.clientWidth)
  }

  return (
    <Tooltip
      content={truncated ? sector : null}
      disabled={!truncated}
      className={`block max-w-full ${className}`}
    >
      <span
        ref={ref}
        onMouseEnter={checkTruncation}
        onFocus={checkTruncation}
        className="block truncate text-xs text-dt-meta"
      >
        {sector}
      </span>
    </Tooltip>
  )
}
