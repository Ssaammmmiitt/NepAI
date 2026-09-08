import { Link } from 'react-router-dom'
import type { CompareEntry } from '@/types'
import { formatNumber, formatPercent } from '@/utils/formatters'

interface CompareTableProps {
  entries: CompareEntry[]
  loading: boolean
}

function SkeletonRow() {
  return (
    <tr className="border-t border-dt-border">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="h-3 w-16 animate-pulse bg-dt-border" />
        </td>
      ))}
    </tr>
  )
}

const COLS = ['Ticker', 'Price', 'Change', '52W High', '52W Low', 'RSI', 'EMA 20']

export function CompareTable({ entries, loading }: CompareTableProps) {
  const sorted = [...entries].sort((a, b) => {
    const aLast = a.normalised.at(-1)?.value ?? 0
    const bLast = b.normalised.at(-1)?.value ?? 0
    return bLast - aLast
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-dt-border bg-dt-bg">
            {COLS.map((col) => (
              <th
                key={col}
                className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-meta"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && entries.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            sorted.map((entry) => {
              const change = entry.summary?.change ?? 0
              const isPos = change >= 0
              const rsi = entry.indicators?.rsi
              const rsiClass =
                rsi == null
                  ? 'text-dt-meta'
                  : rsi > 70
                  ? 'text-dt-negative'
                  : rsi < 30
                  ? 'text-dt-positive'
                  : 'text-dt-text'

              return (
                <tr key={entry.ticker} className="border-t border-dt-border hover:bg-dt-bg">
                  {/* Ticker */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full mr-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <Link
                      to={`/stock/${entry.ticker}`}
                      className="font-mono text-xs font-semibold text-dt-text hover:underline"
                    >
                      {entry.ticker}
                    </Link>
                  </td>
                  {/* Price */}
                  <td className="px-3 py-2.5 font-mono text-xs text-dt-text">
                    {entry.summary ? formatNumber(entry.summary.latest_close) : '—'}
                  </td>
                  {/* Change */}
                  <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${isPos ? 'text-dt-positive' : 'text-dt-negative'}`}>
                    {entry.summary ? formatPercent(entry.summary.change) : '—'}
                  </td>
                  {/* 52W High */}
                  <td className="px-3 py-2.5 font-mono text-xs text-dt-meta">
                    {entry.summary ? formatNumber(entry.summary.high_52w) : '—'}
                  </td>
                  {/* 52W Low */}
                  <td className="px-3 py-2.5 font-mono text-xs text-dt-meta">
                    {entry.summary ? formatNumber(entry.summary.low_52w) : '—'}
                  </td>
                  {/* RSI */}
                  <td className={`px-3 py-2.5 font-mono text-xs ${rsiClass}`}>
                    {rsi != null ? rsi.toFixed(1) : '—'}
                  </td>
                  {/* EMA 20 */}
                  <td className="px-3 py-2.5 font-mono text-xs text-dt-meta">
                    {entry.indicators?.ema?.ema20 != null
                      ? formatNumber(entry.indicators.ema.ema20)
                      : '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
