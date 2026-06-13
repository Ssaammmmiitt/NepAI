import { useEffect } from 'react'
import { LineSeries, type IChartApi, type LineData, type Time } from 'lightweight-charts'
import type { PredictionDay } from '@/types'
import { chartColors } from '@/utils/colors'
import { safeRemoveSeries } from '@/utils/chartHelpers'

interface PredictionOverlayProps {
  chart: IChartApi | null
  lastDate?: string
  lastClose?: number
  predictions: PredictionDay[]
}

export function PredictionOverlay({
  chart,
  lastDate,
  lastClose,
  predictions,
}: PredictionOverlayProps) {
  useEffect(() => {
    if (!chart || !lastDate || lastClose === undefined || predictions.length === 0) {
      return
    }

    const lineSeries = chart.addSeries(LineSeries, {
      color: chartColors.prediction,
      lineWidth: 2,
      lineStyle: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: false,
    })

    const lineData: LineData<Time>[] = [
      { time: lastDate as Time, value: lastClose },
      ...predictions.map((p) => ({ time: p.date as Time, value: p.price })),
    ]
    lineSeries.setData(lineData)

    return () => {
      safeRemoveSeries(chart, lineSeries)
    }
  }, [chart, lastDate, lastClose, predictions])

  return null
}
