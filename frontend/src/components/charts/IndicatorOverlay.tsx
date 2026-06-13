import { useEffect } from 'react'
import { LineSeries, type IChartApi, type ISeriesApi, type LineData, type Time } from 'lightweight-charts'
import type { Indicators } from '@/types'
import { chartColors } from '@/utils/colors'
import { safeRemoveSeries } from '@/utils/chartHelpers'

interface IndicatorOverlayProps {
  chart: IChartApi | null
  lastDate?: string
  indicators: Indicators | null
}

export function IndicatorOverlay({ chart, lastDate, indicators }: IndicatorOverlayProps) {
  useEffect(() => {
    if (!chart || !lastDate || !indicators) return

    const lines: { color: string; value: number | null; title: string }[] = [
      { color: chartColors.ema20, value: indicators.ema.ema20, title: 'EMA 20' },
      { color: chartColors.ema50, value: indicators.ema.ema50, title: 'EMA 50' },
      { color: chartColors.bullish, value: indicators.bollinger.upper, title: 'BB Upper' },
      { color: chartColors.bearish, value: indicators.bollinger.lower, title: 'BB Lower' },
    ]

    const created: ISeriesApi<'Line'>[] = []

    for (const line of lines) {
      if (line.value == null) continue
      const series = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 1,
        lineStyle: 0,
        crosshairMarkerVisible: false,
        lastValueVisible: true,
        priceLineVisible: false,
        title: line.title,
      })
      const point: LineData<Time> = { time: lastDate as Time, value: line.value }
      series.setData([point])
      created.push(series)
    }

    return () => {
      for (const series of created) {
        safeRemoveSeries(chart, series)
      }
    }
  }, [chart, lastDate, indicators])

  return null
}
