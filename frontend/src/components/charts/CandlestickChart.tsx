import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { OHLCRow } from '@/types'
import { getChartTheme } from '@/utils/colors'
import { useThemeStore } from '@/store/themeStore'

import { defaultChartHeights } from '@/hooks/useChartHeight'

interface CandlestickChartProps {
  data: OHLCRow[]
  height?: number
  onChartReady?: (chart: IChartApi | null) => void
}

export function CandlestickChart({
  data,
  height = defaultChartHeights.candle,
  onChartReady,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const onChartReadyRef = useRef(onChartReady)
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  useEffect(() => {
    onChartReadyRef.current = onChartReady
  }, [onChartReady])

  // Create chart once on mount; destroy only on unmount
  useEffect(() => {
    if (!containerRef.current) return

    const dark = useThemeStore.getState().theme === 'dark'
    const themeConfig = getChartTheme(dark)
    const chart = createChart(containerRef.current, {
      height,
      layout: themeConfig.layout,
      grid: themeConfig.grid,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: { mode: 1 },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: themeConfig.upColor,
      downColor: themeConfig.downColor,
      wickUpColor: themeConfig.wickUpColor,
      wickDownColor: themeConfig.wickDownColor,
      borderUpColor: themeConfig.borderUpColor,
      borderDownColor: themeConfig.borderDownColor,
    })

    chartRef.current = chart
    seriesRef.current = series
    onChartReadyRef.current?.(chart)

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      chart.applyOptions({ width })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      onChartReadyRef.current?.(null)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [height])

  // Update chart colors when theme changes without recreating the chart
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return

    const themeConfig = getChartTheme(isDark)
    chartRef.current.applyOptions({
      layout: themeConfig.layout,
      grid: themeConfig.grid,
    })
    seriesRef.current.applyOptions({
      upColor: themeConfig.upColor,
      downColor: themeConfig.downColor,
      wickUpColor: themeConfig.wickUpColor,
      wickDownColor: themeConfig.wickDownColor,
      borderUpColor: themeConfig.borderUpColor,
      borderDownColor: themeConfig.borderDownColor,
    })
  }, [isDark])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || data.length === 0) return

    const candleData: CandlestickData<Time>[] = data.map((row) => ({
      time: row.date as Time,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    }))
    seriesRef.current.setData(candleData)
    chartRef.current.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full" />
}
