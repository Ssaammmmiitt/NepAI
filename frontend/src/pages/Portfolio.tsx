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
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [formError, setFormError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const showToast = useToastStore((s) => s.show)

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

  const handleRemove = async (t: string) => {
    setRemoving(t)
    try {
      await removeStock(t)
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
          <div className="flex flex-col gap-6">
            <PortfolioSummary
              totalValue={totalValue}
              totalPnl={totalPnl}
              totalPnlPercent={totalPnlPercent}
              holdingsCount={holdings.length}
            />

            {error ? <p className="text-dt-negative">{error}</p> : null}

            {holdings.length === 0 ? (
              <div className="border border-dt-border bg-dt-surface p-12 text-center">
                <p className="text-dt-meta">No holdings yet</p>
                <Button className="mt-4" onClick={openAdd}>
                  Add your first stock
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {holdings.map((h) => (
                  <PortfolioCard
                    key={h.ticker}
                    holding={h}
                    onRemove={handleRemove}
                    removing={removing === h.ticker}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </PageWrapper>

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
