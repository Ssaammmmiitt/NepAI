import { useEffect, useState } from 'react'

const CHART_SCALE = 1.12

const BASE_CANDLE = { sm: 240, md: 300, lg: 400 } as const
const BASE_VOLUME = { sm: 72, md: 96, lg: 120 } as const

function scale(n: number) {
  return Math.round(n * CHART_SCALE)
}

export interface ChartHeights {
  candle: number
  volume: number
}

function heightsForWidth(width: number): ChartHeights {
  if (width < 640) {
    return { candle: scale(BASE_CANDLE.sm), volume: scale(BASE_VOLUME.sm) }
  }
  if (width < 1024) {
    return { candle: scale(BASE_CANDLE.md), volume: scale(BASE_VOLUME.md) }
  }
  return { candle: scale(BASE_CANDLE.lg), volume: scale(BASE_VOLUME.lg) }
}

export const defaultChartHeights = heightsForWidth(1280)

export function useChartHeight(): ChartHeights {
  const [heights, setHeights] = useState<ChartHeights>(() =>
    typeof window !== 'undefined' ? heightsForWidth(window.innerWidth) : defaultChartHeights,
  )

  useEffect(() => {
    const update = () => setHeights(heightsForWidth(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return heights
}
