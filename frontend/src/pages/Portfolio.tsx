import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PortfolioSummary } from '@/components/widgets/PortfolioSummary'
import { PortfolioCard } from '@/components/cards/PortfolioCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useStockStore } from '@/store/stockStore'
import { useToastStore } from '@/store/toastStore'
import { formatCurrency } from '@/utils/formatters'
import { usePageEntrance, useRowEntrance } from '@/hooks/useAnimations'

export function Portfolio() {
  const {
    holdings,
    loading,
    error,
    totalValue,
    totalPnl,
    totalPnlPercent,
    addStock,
    removeStock,
  } = usePortfolio()
  const { tickers, loadTickers } = useStockStore()

  const [showAdd, setShowAdd] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [formError, setFormError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const showToast = useToastStore((s) => s.show)
  const containerRef = usePageEntrance('[data-section]', { enabled: !loading || holdings.length > 0 })
  const gridRef = useRowEntrance('[data-animate]', { enabled: holdings.length > 0 })

  const holdingToRemove = confirmRemove
    ? holdings.find((h) => h.ticker === confirmRemove)
    : null

  const openAdd = () => {
    void loadTickers(true)
    setShowAdd(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const qty = parseInt(quantity, 10)
    const price = parseFloat(entryPrice)
    if (!ticker.trim() || !qty || qty <= 0 || !price || price <= 0) {
      setFormError('Fill all fields with valid values')
      return
    }
    setAdding(true)
    try {
      await addStock(ticker.toUpperCase(), qty, price)
      setShowAdd(false)
      setTicker('')
      setQuantity('')
      setEntryPrice('')
      showToast(`Added ${ticker.toUpperCase()} to portfolio`)
    } catch {
      setFormError('Failed to add stock')
      showToast('Failed to add stock', 'error')
    } finally {
      setAdding(false)
    }
  }

  const closeConfirmRemove = () => {
    if (!removing) setConfirmRemove(null)
  }

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return
    const t = confirmRemove
    setRemoving(t)
    try {
      await removeStock(t)
      setConfirmRemove(null)
      showToast(`Removed ${t} from portfolio`)
    } catch {
      showToast(`Failed to remove ${t}`, 'error')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <Header
        title="Portfolio"
        subtitle="Track your NEPSE holdings"
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Stock
          </Button>
        }
      />
      <PageWrapper>
        {loading && holdings.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div ref={containerRef} className="flex flex-col gap-5 sm:gap-6">
            <section
              data-section
              className="border border-dt-border bg-dt-surface p-4 sm:p-5"
            >
              <p className="dt-eyebrow mb-4">Portfolio Overview</p>
              <PortfolioSummary
                totalValue={totalValue}
                totalPnl={totalPnl}
                totalPnlPercent={totalPnlPercent}
                holdingsCount={holdings.length}
              />
            </section>

            {error ? <p className="text-dt-negative">{error}</p> : null}

            <section
              data-section
              className="border border-dt-border bg-dt-bg p-4 sm:p-5"
            >
              <p className="dt-eyebrow mb-4">Your Holdings</p>

              {holdings.length === 0 ? (
                <div className="border border-dashed border-dt-border bg-dt-surface p-12 text-center">
                  <p className="text-dt-meta">No holdings yet</p>
                  <Button className="mt-4" onClick={openAdd}>
                    Add your first stock
                  </Button>
                </div>
              ) : (
                <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {holdings.map((h) => (
                    <div key={h.ticker} data-animate>
                      <PortfolioCard
                        holding={h}
                        onRemove={setConfirmRemove}
                        removing={removing === h.ticker}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </PageWrapper>

      <Modal open={confirmRemove !== null} onClose={closeConfirmRemove} title="Remove Holding">
        {holdingToRemove ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-dt-text">
              Remove{' '}
              <span className="font-mono font-semibold text-dt-text">{holdingToRemove.ticker}</span>{' '}
              from your portfolio? This cannot be undone.
            </p>
            <div className="border border-dt-border bg-dt-bg px-4 py-3">
              <p className="dt-eyebrow">Position</p>
              <p className="mt-1 font-mono text-sm text-dt-text">
                {holdingToRemove.quantity} shares @ {formatCurrency(holdingToRemove.entry_price)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeConfirmRemove}
                disabled={removing === confirmRemove}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={handleConfirmRemove}
                loading={removing === confirmRemove}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Stock">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-dt-meta">
              Ticker
            </label>
            <input
              list="tickers"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="NABIL"
              className="border border-dt-border bg-dt-surface px-4 py-2.5 font-mono text-sm text-dt-text outline-none placeholder:text-dt-meta hover:border-dt-text focus:border-dt-text focus:shadow-[4px_4px_0_0_var(--dt-shadow)]"
            />
            <datalist id="tickers">
              {tickers.map((t) => (
                <option key={t.ticker} value={t.ticker} />
              ))}
            </datalist>
          </div>
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input
            label="Entry price (NPR)"
            type="number"
            min="0.01"
            step="0.01"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
          {formError ? <p className="text-sm text-dt-negative">{formError}</p> : null}
          <Button type="submit" loading={adding} className="w-full">
            Add Stock
          </Button>
        </form>
      </Modal>
    </>
  )
}
