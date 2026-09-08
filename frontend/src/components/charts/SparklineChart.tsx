import { useEffect, useRef } from 'react'
import { LineSeries, createChart, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts'
import type { OHLCRow } from '@/types'
import { getChartTheme } from '@/utils/colors'
import { useThemeStore } from '@/store/themeStore'

interface SparklineChartProps {
  data: OHLCRow[]
  height?: number
  color?: string
}

export function SparklineChart({ data, height = 40, color = '#10B981' }: SparklineChartProps) {
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
      autoSize: true,
      height,
      layout: themeConfig.layout,
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [height, color])

  useEffect(() => {
    if (!chartRef.current) return
    const themeConfig = getChartTheme(isDark)
    chartRef.current.applyOptions({ layout: themeConfig.layout })
  }, [isDark])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || data.length === 0) return
    seriesRef.current.setData(data.map((row) => ({ time: row.date as Time, value: row.close })))
    chartRef.current.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full" style={{ height }} />
}
