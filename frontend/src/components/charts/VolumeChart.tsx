import { useEffect, useRef } from 'react'
import {
  HistogramSeries,
  createChart,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { OHLCRow } from '@/types'
import { chartColors, getChartTheme } from '@/utils/colors'
import { useThemeStore } from '@/store/themeStore'

import { defaultChartHeights } from '@/hooks/useChartHeight'

interface VolumeChartProps {
  data: OHLCRow[]
  height?: number
}

export function VolumeChart({ data, height = defaultChartHeights.volume }: VolumeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
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
      timeScale: { borderVisible: false, visible: false },
    })

    const series = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
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
    if (!seriesRef.current || data.length === 0) return

    const volumeData: HistogramData<Time>[] = data.map((row) => ({
      time: row.date as Time,
      value: row.volume,
      color: row.per_change >= 0 ? chartColors.volumeUp : chartColors.volumeDown,
    }))
    seriesRef.current.setData(volumeData)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full" />
}
