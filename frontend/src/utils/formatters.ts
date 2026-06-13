const nprFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-NP', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return nprFormatter.format(value)
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value)
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-NP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kathmandu',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kathmandu',
  })
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

export function predictionLabel(day: number): string {
  switch (day) {
    case 1:
      return 'Tomorrow'
    case 5:
      return '1-Week'
    default:
      return `Day ${day}`
  }
}
