import { useEffect, useRef } from 'react'
import {
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { OHLCRow } from '@/types'
import { getChartTheme } from '@/utils/colors'
import { useThemeStore } from '@/store/themeStore'

interface HistoricalPriceChartProps {
  data: OHLCRow[]
  height?: number
}

export function HistoricalPriceChart({ data, height = 260 }: HistoricalPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!containerRef.current) return

    const dark = useThemeStore.getState().theme === 'dark'
    const themeConfig = getChartTheme(dark)
    const chart = createChart(containerRef.current, {
      height,
      layout: themeConfig.layout,
      grid: themeConfig.grid,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
      crosshair: { mode: 1 },
    })

    const series = chart.addSeries(LineSeries, {
      color: '#10B981',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      chart.applyOptions({ width })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [height])

  useEffect(() => {
    if (!chartRef.current) return
    const themeConfig = getChartTheme(isDark)
    chartRef.current.applyOptions({
      layout: themeConfig.layout,
      grid: themeConfig.grid,
    })
  }, [isDark])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || data.length === 0) return
    seriesRef.current.setData(
      data.map((row) => ({ time: row.date as Time, value: row.close })),
    )
    chartRef.current.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full" />
}
