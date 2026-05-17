import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { PortfolioSummary } from '../components/widgets/PortfolioSummary';
import { PortfolioCard } from '../components/cards/PortfolioCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePortfolioStore } from '../store/portfolioStore';
import { Plus, AlertTriangle } from 'lucide-react';

export default function Portfolio() {
  const { holdings, loading } = usePortfolio();
  const removeHolding = usePortfolioStore((s) => s.removeHolding);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tickerToDelete, setTickerToDelete] = useState('');
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [entryPrice, setEntryPrice] = useState(0);

  const handleAdd = async () => {
    if (!ticker || !entryPrice) return;
    await usePortfolioStore.getState().addHolding({ ticker, quantity, entry_price: entryPrice });
    setShowAdd(false);
    setTicker('');
    setQuantity(1);
    setEntryPrice(0);
  };

  const handleRemoveClick = (ticker: string) => {
    setTickerToDelete(ticker);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (tickerToDelete) {
      await removeHolding(tickerToDelete);
      setTickerToDelete('');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Header title="Portfolio" subtitle="Track your NEPSE holdings" />
      <div className="flex flex-col gap-8">
        <PortfolioSummary />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Holdings</h2>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Stock
          </Button>
        </div>

        {loading ? (
          <Spinner label="Loading portfolio..." />
        ) : holdings.length === 0 ? (
          <div className="bg-bg-card border border-border-color rounded-2xl p-12 shadow-card text-center">
            <p className="text-sm">No holdings yet. Add stocks to start tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {holdings.map((item) => (
              <PortfolioCard key={item.ticker} item={item} onRemoveClick={handleRemoveClick} />
            ))}
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowAdd(false)}>
            <div className="bg-bg-card border border-border-color rounded-2xl p-6 w-[400px] max-w-[90%] shadow-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold">Add Stock</h3>
              <div className="flex flex-col gap-4 mt-6">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-secondary">Ticker</span>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. NABIL"
                    className="px-3 py-2 bg-bg-hover border border-border-color rounded-lg text-text-primary font-mono text-sm outline-none focus:border-accent-primary placeholder:text-text-muted"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-secondary">Quantity</span>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    className="px-3 py-2 bg-bg-hover border border-border-color rounded-lg text-text-primary font-mono text-sm outline-none focus:border-accent-primary"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-secondary">Entry Price (Rs.)</span>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    min={0}
                    step={0.01}
                    className="px-3 py-2 bg-bg-hover border border-border-color rounded-lg text-text-primary font-mono text-sm outline-none focus:border-accent-primary"
                  />
                </label>
                <div className="flex gap-2 justify-end mt-2">
                  <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleAdd}>Add</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-bg-card border border-border-alert rounded-2xl p-6 w-[400px] max-w-[90%] shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bearish-bg">
                  <AlertTriangle size={20} className="text-bearish" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Remove Stock</h3>
                  <p className="text-xs text-text-secondary">This action cannot be undone</p>
                </div>
              </div>
              <div className="px-4 py-3 bg-bg-alert rounded-lg border-l-[3px] border-border-alert mb-6">
                <p className="text-sm text-bearish">
                  Are you sure you want to remove <strong>{tickerToDelete}</strong> from your portfolio? All tracking data for this stock will be lost.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmDelete}>Remove</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
