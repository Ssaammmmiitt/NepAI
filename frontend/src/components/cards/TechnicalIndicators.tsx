import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import type { Indicators } from '@/types'
import { formatNumber } from '@/utils/formatters'

interface TechnicalIndicatorsProps {
  indicators: Indicators | null
  loading?: boolean
}

function IndicatorRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-dt-meta">{label}</span>
      <span className={`font-mono text-xs font-medium ${highlight || 'text-dt-text'}`}>{value}</span>
    </div>
  )
}

function rsiHighlight(rsi: number | null): string | undefined {
  if (rsi == null) return undefined
  if (rsi > 70) return 'text-dt-negative'
  if (rsi < 30) return 'text-dt-accent-bright'
  return undefined
}

function histogramHighlight(value: number | null): string | undefined {
  if (value == null) return undefined
  return value >= 0 ? 'text-dt-accent-bright' : 'text-dt-negative'
}

export function TechnicalIndicators({ indicators, loading }: TechnicalIndicatorsProps) {
  if (loading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner />
      </Card>
    )
  }

  if (!indicators) {
    return (
      <Card title="Indicators">
        <p className="text-xs text-dt-meta">No indicator data available</p>
      </Card>
    )
  }

  return (
    <Card title="Indicators">
      <div className="divide-y divide-dt-border">
        <IndicatorRow label="RSI (14)" value={formatNumber(indicators.rsi, 1)} highlight={rsiHighlight(indicators.rsi)} />
        <IndicatorRow label="MACD" value={formatNumber(indicators.macd.macd, 2)} />
        <IndicatorRow label="Signal" value={formatNumber(indicators.macd.signal, 2)} />
        <IndicatorRow
          label="Histogram"
          value={formatNumber(indicators.macd.histogram, 2)}
          highlight={histogramHighlight(indicators.macd.histogram)}
        />
        <IndicatorRow label="BB Upper" value={formatNumber(indicators.bollinger.upper, 2)} />
        <IndicatorRow label="BB Middle" value={formatNumber(indicators.bollinger.middle, 2)} />
        <IndicatorRow label="BB Lower" value={formatNumber(indicators.bollinger.lower, 2)} />
        <IndicatorRow label="EMA 20" value={formatNumber(indicators.ema.ema20, 2)} />
        <IndicatorRow label="EMA 50" value={formatNumber(indicators.ema.ema50, 2)} />
      </div>
    </Card>
  )
}
