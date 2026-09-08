import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { stockAPI } from '@/services/api'
import { toCSV, triggerDownload } from '@/utils/formatters'
import type { OHLCRow } from '@/types'

type Period = '7D' | '30D' | '90D' | '1Y' | 'All'
const PERIODS: Period[] = ['7D', '30D', '90D', '1Y', 'All']

function fromDate(period: Period): string | undefined {
  if (period === 'All') return undefined
  const dayMs = 24 * 60 * 60 * 1000
  const map: Record<Exclude<Period, 'All'>, number> = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 }
  return new Date(Date.now() - map[period] * dayMs).toISOString().slice(0, 10)
}

interface ExportModalProps {
  ticker: string
  open: boolean
  onClose: () => void
}

export function ExportModal({ ticker, open, onClose }: ExportModalProps) {
  const [period, setPeriod] = useState<Period>('90D')
  const [ohlc, setOhlc] = useState<OHLCRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !ticker) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await stockAPI.getOHLC(ticker, fromDate(period))
        if (!cancelled) setOhlc(res.data)
      } catch {
        if (!cancelled) setError('Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [open, ticker, period])

  const handleDownload = () => {
    if (!ohlc.length) return
    const csv = toCSV(ohlc)
    triggerDownload(csv, `${ticker}_${period}.csv`)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Export ${ticker} — CSV`}>
      <div className="flex flex-col gap-5">
        {/* Period picker */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-meta">
            Period
          </p>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`border px-2.5 py-1 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                  period === p
                    ? 'border-dt-accent-bright bg-dt-accent-bright/10 text-dt-accent-bright'
                    : 'border-dt-border text-dt-meta hover:border-dt-text hover:text-dt-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2">
          {loading ? (
            <Spinner size="sm" />
          ) : error ? (
            <p className="font-mono text-xs text-dt-negative">{error}</p>
          ) : ohlc.length > 0 ? (
            <span className="border border-dt-border bg-dt-bg px-2.5 py-1 font-mono text-xs text-dt-meta">
              {ohlc.length} trading days
            </span>
          ) : null}
        </div>

        {/* Download */}
        <Button
          className="w-full"
          disabled={loading || ohlc.length === 0}
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Download CSV
        </Button>
      </div>
    </Modal>
  )
}
