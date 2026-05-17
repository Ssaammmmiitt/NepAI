import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { PortfolioSummary } from '../components/widgets/PortfolioSummary';
import { PortfolioCard } from '../components/cards/PortfolioCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { usePortfolio } from '../hooks/usePortfolio';
import { usePortfolioStore } from '../store/portfolioStore';
import { Plus } from 'lucide-react';
import './Portfolio.css';

export default function Portfolio() {
  const { holdings, loading } = usePortfolio();
  const removeHolding = usePortfolioStore((s) => s.removeHolding);
  const [showAdd, setShowAdd] = useState(false);
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

  return (
    <>
      <Header title="Portfolio" subtitle="Track your NEPSE holdings" />
      <div className="portfolio-content">
        <PortfolioSummary />

        <div className="portfolio-header">
          <h2 className="text-heading">Holdings</h2>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Stock
          </Button>
        </div>

        {loading ? (
          <Spinner label="Loading portfolio..." />
        ) : holdings.length === 0 ? (
          <div className="card portfolio-empty">
            <p className="text-body">No holdings yet. Add stocks to start tracking.</p>
          </div>
        ) : (
          <div className="portfolio-grid">
            {holdings.map((item) => (
              <PortfolioCard key={item.ticker} item={item} onRemove={removeHolding} />
            ))}
          </div>
        )}

        {showAdd && (
          <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-heading">Add Stock</h3>
              <div className="modal-form">
                <label>
                  <span className="text-caption">Ticker</span>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. NABIL"
                  />
                </label>
                <label>
                  <span className="text-caption">Quantity</span>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                  />
                </label>
                <label>
                  <span className="text-caption">Entry Price (Rs.)</span>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    min={0}
                    step={0.01}
                  />
                </label>
                <div className="modal-actions">
                  <Button variant="secondary" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAdd}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
