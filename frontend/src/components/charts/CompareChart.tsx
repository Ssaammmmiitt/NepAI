import { useEffect, useRef } from 'react'
import { LineSeries, createChart, type IChartApi, type Time } from 'lightweight-charts'
import type { CompareEntry } from '@/types'
import { getChartTheme } from '@/utils/colors'
import { useThemeStore } from '@/store/themeStore'

interface CompareChartProps {
  entries: CompareEntry[]
  height?: number
}

export function CompareChart({ entries, height = 360 }: CompareChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return
    const dark = useThemeStore.getState().theme === 'dark'
    const themeConfig = getChartTheme(dark)

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: themeConfig.layout,
      grid: themeConfig.grid,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
      crosshair: { mode: 1 },
    })

    chartRef.current = chart
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [height])

  // Sync theme
  useEffect(() => {
    if (!chartRef.current) return
    const themeConfig = getChartTheme(isDark)
    chartRef.current.applyOptions({ layout: themeConfig.layout, grid: themeConfig.grid })
  }, [isDark])

  // Rebuild series whenever entries change
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Remove all existing series by removing and re-creating the chart is tricky;
    // instead keep refs to series and remove them individually.
    // Simpler: remove chart and re-create — but that causes flicker.
    // Best approach: track series refs and call chart.removeSeries.
    const seriesRefs: ReturnType<typeof chart.addSeries>[] = []

    entries.forEach((entry) => {
      if (entry.normalised.length === 0) return
      const series = chart.addSeries(LineSeries, {
        color: entry.color,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        lastValueVisible: true,
        priceLineVisible: false,
        title: entry.ticker,
      })
      series.setData(entry.normalised.map((p) => ({ time: p.time as Time, value: p.value })))
      seriesRefs.push(series)
    })

    if (seriesRefs.length > 0) chart.timeScale().fitContent()

    return () => {
      seriesRefs.forEach((s) => {
        try { chart.removeSeries(s) } catch { /* already removed */ }
      })
    }
  }, [entries])

  return <div ref={containerRef} className="w-full" style={{ height }} />
}
