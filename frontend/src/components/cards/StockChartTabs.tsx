import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IChartApi } from 'lightweight-charts'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { PredictionOverlay } from '@/components/charts/PredictionOverlay'
import { IndicatorOverlay } from '@/components/charts/IndicatorOverlay'
import { HistoricalPriceChart } from '@/components/charts/HistoricalPriceChart'
import { HistoricalDataTable } from '@/components/cards/HistoricalDataTable'
import { DateInput } from '@/components/ui/DateInput'
import { Spinner } from '@/components/ui/Spinner'
import { stockAPI } from '@/services/api'
import type { Indicators, OHLCRow, Prediction } from '@/types'
import type { ChartHeights } from '@/hooks/useChartHeight'
import { formatCurrency } from '@/utils/formatters'

type ActiveTab = 'chart' | 'history'
type Period = '1M' | '3M' | '6M' | '1Y' | 'All'

interface StockChartTabsProps {
  ticker: string
  ohlc: OHLCRow[]
  prediction: Prediction | null
  indicators: Indicators | null
  chartHeights: ChartHeights
  onChartReady: (chart: IChartApi | null) => void
}

function periodToDate(period: Exclude<Period, 'All'>): string {
  const d = new Date()
  const months: Record<Exclude<Period, 'All'>, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }
  d.setMonth(d.getMonth() - months[period])
  return d.toISOString().split('T')[0]
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
        active
          ? 'border-b-2 border-dt-accent-bright text-dt-accent-bright'
          : 'border-b-2 border-transparent text-dt-meta hover:text-dt-text'
      }`}
    >
      {children}
    </button>
  )
}

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] border ${
        active
          ? 'border-dt-accent-bright bg-dt-accent-bright/10 text-dt-accent-bright'
          : 'border-dt-border text-dt-meta hover:border-dt-text hover:text-dt-text'
      }`}
    >
      {children}
    </button>
  )
}

export function StockChartTabs({
  ticker,
  ohlc,
  prediction,
  indicators,
  chartHeights,
  onChartReady,
}: StockChartTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart')
  const [period, setPeriod] = useState<Period>('6M')
  const [chart, setChart] = useState<IChartApi | null>(null)

  // History tab state
  const [historyRows, setHistoryRows] = useState<OHLCRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const handleChartReady = useCallback(
    (c: IChartApi | null) => {
      setChart(c)
      onChartReady(c)
    },
    [onChartReady],
  )

  // Load full history when history tab is first opened
  useEffect(() => {
    if (activeTab !== 'history' || historyLoaded) return
    setHistoryLoading(true)
    stockAPI
      .getHistory(ticker)
      .then(({ data }) => {
        setHistoryRows([...data.data].reverse())
        setHistoryLoaded(true)
      })
      .catch(() => {
        setHistoryLoaded(true)
      })
      .finally(() => setHistoryLoading(false))
  }, [activeTab, ticker, historyLoaded])

  // Chart tab: filter ohlc by selected period
  const chartData = useMemo(() => {
    if (period === 'All') return ohlc
    const cutoff = periodToDate(period)
    return ohlc.filter((r) => r.date >= cutoff)
  }, [ohlc, period])

  const lastRow = chartData[chartData.length - 1]

  // History tab: filter by date range for chart (oldest-first for chart)
  const historyChartData = useMemo(() => {
    let rows = [...historyRows].reverse() // oldest first for chart
    if (fromDate) rows = rows.filter((r) => r.date >= fromDate)
    if (toDate) rows = rows.filter((r) => r.date <= toDate)
    return rows
  }, [historyRows, fromDate, toDate])

  const totalRows = ohlc.length

  // Stats for the history tab mini summary
  const historyStats = useMemo(() => {
    if (historyChartData.length === 0) return null
    const closes = historyChartData.map((r) => r.close)
    const high = Math.max(...closes)
    const low = Math.min(...closes)
    const first = historyChartData[0].close
    const last = historyChartData[historyChartData.length - 1].close
    const pct = ((last - first) / first) * 100
    return { high, low, pct }
  }, [historyChartData])

  return (
    <div className="dt-card !p-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-dt-border px-4">
        <div className="flex">
          <TabButton active={activeTab === 'chart'} onClick={() => setActiveTab('chart')}>
            Candlestick
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            History
          </TabButton>
        </div>

        {/* Period selector — chart tab only */}
        {activeTab === 'chart' && (
          <div className="flex items-center gap-1 py-2">
            {(['1M', '3M', '6M', '1Y', 'All'] as Period[]).map((p) => (
              <PeriodButton key={p} active={period === p} onClick={() => setPeriod(p)}>
                {p}
              </PeriodButton>
            ))}
          </div>
        )}

        {/* Date range — history tab */}
        {activeTab === 'history' && (
          <div className="flex items-center gap-2 py-2">
            {(['1Y', '2Y', '5Y', 'All'] as const).map((label) => {
              const fromYear =
                label === 'All'
                  ? ''
                  : (() => {
                      const d = new Date()
                      d.setFullYear(d.getFullYear() - parseInt(label))
                      return d.toISOString().split('T')[0]
                    })()
              const active = fromDate === fromYear && toDate === ''
              return (
                <PeriodButton
                  key={label}
                  active={active}
                  onClick={() => {
                    setFromDate(fromYear)
                    setToDate('')
                  }}
                >
                  {label}
                </PeriodButton>
              )
            })}
          </div>
        )}
      </div>

      {/* Chart tab content */}
      {activeTab === 'chart' && (
        <div className="flex flex-col p-2 sm:p-4">
          {chartData.length > 0 ? (
            <>
              <CandlestickChart
                data={chartData}
                height={chartHeights.candle}
                onChartReady={handleChartReady}
              />
              <PredictionOverlay
                chart={chart}
                lastDate={lastRow?.date}
                lastClose={lastRow?.close}
                predictions={prediction?.predictions ?? []}
              />
              <IndicatorOverlay
                chart={chart}
                lastDate={lastRow?.date}
                indicators={indicators}
              />
              <VolumeChart data={chartData} height={chartHeights.volume} />
              <p className="mt-2 font-mono text-[10px] text-dt-meta">
                {chartData.length} trading days
                {lastRow?.date ? ` · latest ${lastRow.date}` : ''}
              </p>
            </>
          ) : (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {/* History tab content */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 p-2 sm:p-4">
          {/* Date filter row */}
          <div className="flex flex-wrap items-end gap-3">
            <DateInput label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <DateInput label="To" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
                className="cursor-pointer border border-dt-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta hover:border-dt-text hover:text-dt-text"
              >
                Clear
              </button>
            )}
            <span className="ml-auto font-mono text-[10px] text-dt-meta">
              {totalRows.toLocaleString()} total rows
            </span>
          </div>

          {/* Mini stats */}
          {historyStats && !historyLoading && (
            <div className="grid grid-cols-2 gap-4 border border-dt-border bg-dt-bg px-4 py-3 sm:grid-cols-4 sm:gap-6">
              <div className="min-w-0 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
                  Period High
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-dt-text">
                  {formatCurrency(historyStats.high)}
                </p>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
                  Period Low
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-dt-text">
                  {formatCurrency(historyStats.low)}
                </p>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
                  Net Change
                </p>
                <p
                  className={`mt-1 truncate font-mono text-sm font-semibold tabular-nums ${
                    historyStats.pct >= 0 ? 'text-dt-accent-bright' : 'text-dt-negative'
                  }`}
                >
                  {historyStats.pct >= 0 ? '+' : ''}
                  {historyStats.pct.toFixed(2)}%
                </p>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
                  Data Points
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-dt-text">
                  {historyChartData.length.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Price line chart */}
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : historyChartData.length > 0 ? (
            <div className="min-w-0">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta">
                Close Price
              </p>
              <HistoricalPriceChart data={historyChartData} height={200} />
            </div>
          ) : null}

          {/* Data table */}
          <HistoricalDataTable
            ticker={ticker}
            rows={historyRows}
            loading={historyLoading}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      )}
    </div>
  )
}
