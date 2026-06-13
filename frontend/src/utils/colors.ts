/**
 * Chart colors — bullish/bearish retained per trading convention.
 * Surfaces aligned with Dark Terminal palette.
 */
export const chartColors = {
  bullish: '#26A69A',
  bearish: '#EF5350',
  prediction: '#10B981',
  volumeUp: 'rgba(38, 166, 154, 0.35)',
  volumeDown: 'rgba(239, 83, 80, 0.35)',
  bollingerFill: 'rgba(16, 185, 129, 0.08)',
  ema20: '#10B981',
  ema50: '#7A7A7A',
  gridLight: '#E0E0E0',
  gridDark: '#262626',
  textLight: '#7A7A7A',
  textDark: '#7A7A7A',
  backgroundLight: '#FAFAFA',
  backgroundDark: '#0A0A0A',
  crosshairLight: '#7A7A7A',
  crosshairDark: '#7A7A7A',
} as const

export function getChartTheme(isDark: boolean) {
  return {
    layout: {
      background: { color: isDark ? chartColors.backgroundDark : chartColors.backgroundLight },
      textColor: isDark ? chartColors.textDark : chartColors.textLight,
    },
    grid: {
      vertLines: { color: isDark ? chartColors.gridDark : chartColors.gridLight },
      horzLines: { color: isDark ? chartColors.gridDark : chartColors.gridLight },
    },
    crosshair: {
      vertLine: { color: isDark ? chartColors.crosshairDark : chartColors.crosshairLight },
      horzLine: { color: isDark ? chartColors.crosshairDark : chartColors.crosshairLight },
    },
    upColor: chartColors.bullish,
    downColor: chartColors.bearish,
    wickUpColor: chartColors.bullish,
    wickDownColor: chartColors.bearish,
    borderUpColor: chartColors.bullish,
    borderDownColor: chartColors.bearish,
  }
}
