import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StockChartTabs } from '@/components/cards/StockChartTabs'
import { CurrentSnapshot } from '@/components/cards/CurrentSnapshot'
import { AIPrediction } from '@/components/cards/AIPrediction'
import { TechnicalIndicators } from '@/components/cards/TechnicalIndicators'
import { ModelHealthCard } from '@/components/cards/ModelHealthCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useStockData } from '@/hooks/useStockData'
import { usePrediction } from '@/hooks/usePrediction'
import { useIndicators } from '@/hooks/useIndicators'
import { useChartHeight } from '@/hooks/useChartHeight'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useToastStore } from '@/store/toastStore'
import { usePageEntrance, useRowEntrance } from '@/hooks/useAnimations'

export function StockDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>()
  const upperTicker = ticker.toUpperCase()
  const chartHeights = useChartHeight()

  const [showAddModal, setShowAddModal] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [addError, setAddError] = useState('')

  const { ohlc, summary, loading: stockLoading } = useStockData(upperTicker)
  const { prediction, loading: predLoading, refetch: refetchPrediction } = usePrediction(upperTicker)
  const { indicators, loading: indLoading } = useIndicators(upperTicker)
  const { addStock, loading: portfolioLoading } = usePortfolioStore()
  const showToast = useToastStore((s) => s.show)
  const ready = !stockLoading || ohlc.length > 0
  const containerRef = usePageEntrance('[data-section]', { enabled: ready })
  const cardsRef = useRowEntrance('[data-animate]', { enabled: ready })

  // Keep all ohlc rows; period filtering done inside StockChartTabs
  const allOhlc = useMemo(() => ohlc, [ohlc])

  const handleAddToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    const qty = parseInt(quantity, 10)
    const price = parseFloat(entryPrice)
    if (!qty || qty <= 0 || !price || price <= 0) {
      setAddError('Enter valid quantity and entry price')
      return
    }
    try {
      await addStock(upperTicker, qty, price)
      setShowAddModal(false)
      setQuantity('')
      setEntryPrice('')
      showToast(`Added ${upperTicker} to portfolio`)
    } catch {
      setAddError('Failed to add to portfolio')
      showToast('Failed to add to portfolio', 'error')
    }
  }

  if (stockLoading && ohlc.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <Header
        title={upperTicker}
        subtitle={
          summary?.stock_name
            ? `${summary.stock_name}${summary.stock_sector ? ` · ${summary.stock_sector}` : ''}`
            : 'Stock detail & AI forecast'
        }
        action={
          <Button onClick={() => setShowAddModal(true)}>Add to Portfolio</Button>
        }
      />
      <PageWrapper>
        <div
          ref={containerRef}
          className="flex flex-col gap-4 lg:gap-6"
        >
          {/* Row 1 — snapshot (mobile) */}
          <div className="min-w-0 lg:hidden" data-section>
            <CurrentSnapshot summary={summary} loading={stockLoading} />
          </div>

          {/* Row 2 — chart + sidebar */}
          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
            data-section
          >
            {/* Chart tabs (left / full on mobile) */}
            <div className="min-w-0">
              <StockChartTabs
                ticker={upperTicker}
                ohlc={allOhlc}
                loading={stockLoading}
                prediction={prediction}
                indicators={indicators}
                chartHeights={chartHeights}
                onChartReady={() => {}}
              />
            </div>

            {/* Sidebar — snapshot + indicators (desktop only) */}
            <div className="hidden min-w-0 flex-col gap-4 lg:flex">
              <CurrentSnapshot summary={summary} loading={stockLoading} />
              <TechnicalIndicators indicators={indicators} loading={indLoading} />
            </div>
          </div>

          {/* Row 3 — indicators (mobile) */}
          <div className="lg:hidden" data-section>
            <TechnicalIndicators indicators={indicators} loading={indLoading} />
          </div>

          {/* Row 4 — AI prediction + model health */}
          <div
            ref={cardsRef}
            data-section
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4"
          >
            <div data-animate className="min-w-0 flex-1">
              <AIPrediction
                ticker={upperTicker}
                prediction={prediction}
                loading={predLoading}
                onRetrainComplete={refetchPrediction}
              />
            </div>
            <div data-animate className="w-full shrink-0 sm:w-44">
              <ModelHealthCard prediction={prediction} className="w-full" />
            </div>
          </div>
        </div>
      </PageWrapper>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={`Add ${upperTicker}`}>
        <form onSubmit={handleAddToPortfolio} className="flex flex-col gap-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"
          />
          <Input
            label="Entry price (NPR)"
            type="number"
            min="0.01"
            step="0.01"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder={summary?.latest_close.toFixed(2) ?? '0.00'}
          />
          {addError ? <p className="text-sm text-dt-negative">{addError}</p> : null}
          <Button type="submit" loading={portfolioLoading} className="w-full">
            Add to Portfolio
          </Button>
        </form>
      </Modal>
    </>
  )
}
