import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import type { OHLCRow } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/formatters'

const PAGE_SIZE = 20

function downloadCSV(rows: OHLCRow[], ticker: string) {
  const header = 'Date,Open,High,Low,Close,Volume,Change%'
  const lines = rows.map(
    (r) => `${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume},${r.per_change}`,
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ticker}_history.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface HistoricalDataTableProps {
  ticker: string
  rows: OHLCRow[]
  loading?: boolean
  fromDate: string
  toDate: string
}

export function HistoricalDataTable({
  ticker,
  rows,
  loading = false,
  fromDate,
  toDate,
}: HistoricalDataTableProps) {
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let r = rows
    if (fromDate) r = r.filter((row) => row.date >= fromDate)
    if (toDate) r = r.filter((row) => row.date <= toDate)
    return r
  }, [rows, fromDate, toDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <p className="py-4 text-sm text-dt-meta">No data in selected range</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Table header row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
          {filtered.length.toLocaleString()} rows
        </span>
        <button
          type="button"
          title="Download CSV"
          onClick={() => downloadCSV(filtered, ticker)}
          className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta hover:text-dt-text"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dt-border text-left">
              <th className="dt-eyebrow pb-3 pr-4">Date</th>
              <th className="dt-eyebrow hidden pb-3 pr-4 text-right sm:table-cell">Open</th>
              <th className="dt-eyebrow hidden pb-3 pr-4 text-right md:table-cell">High</th>
              <th className="dt-eyebrow hidden pb-3 pr-4 text-right md:table-cell">Low</th>
              <th className="dt-eyebrow pb-3 pr-4 text-right">Close</th>
              <th className="dt-eyebrow pb-3 pr-4 text-right">Change</th>
              <th className="dt-eyebrow pb-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.date}
                className="border-b border-dt-border last:border-0 hover:bg-dt-bg"
              >
                <td className="py-2 pr-4 font-mono text-xs text-dt-text">{row.date}</td>
                <td className="hidden py-2 pr-4 text-right font-mono text-xs text-dt-meta sm:table-cell">
                  {formatCurrency(row.open)}
                </td>
                <td className="hidden py-2 pr-4 text-right font-mono text-xs text-dt-meta md:table-cell">
                  {formatCurrency(row.high)}
                </td>
                <td className="hidden py-2 pr-4 text-right font-mono text-xs text-dt-meta md:table-cell">
                  {formatCurrency(row.low)}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-xs font-medium text-dt-text">
                  {formatCurrency(row.close)}
                </td>
                <td
                  className={`py-2 pr-4 text-right font-mono text-xs font-medium ${
                    row.per_change > 0
                      ? 'text-dt-accent-bright'
                      : row.per_change < 0
                        ? 'text-dt-negative'
                        : 'text-dt-meta'
                  }`}
                >
                  {formatPercent(row.per_change)}
                </td>
                <td className="py-2 text-right font-mono text-xs text-dt-meta">
                  {row.volume.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-dt-border pt-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta disabled:cursor-not-allowed disabled:opacity-40 hover:text-dt-text"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Prev
          </button>
          <span className="font-mono text-xs text-dt-meta">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta disabled:cursor-not-allowed disabled:opacity-40 hover:text-dt-text"
          >
            Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
