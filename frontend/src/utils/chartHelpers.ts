import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts'

export function safeRemoveSeries(
  chart: IChartApi | null | undefined,
  series: ISeriesApi<SeriesType> | null | undefined,
) {
  if (!chart || !series) return
  try {
    chart.removeSeries(series)
  } catch {
    // Chart may already be destroyed during unmount or theme transitions
  }
}
