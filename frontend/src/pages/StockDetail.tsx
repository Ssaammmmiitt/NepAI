import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { CandlestickChart } from '../components/charts/CandlestickChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import { CurrentSnapshot } from '../components/cards/CurrentSnapshot';
import { AIPrediction } from '../components/cards/AIPrediction';
import { TechnicalIndicators } from '../components/cards/TechnicalIndicators';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useStockData } from '../hooks/useStockData';
import { usePrediction } from '../hooks/usePrediction';
import { usePortfolioStore } from '../store/portfolioStore';
import { Plus, AlertTriangle } from 'lucide-react';

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [entryPrice, setEntryPrice] = useState(0);

  const { data: ohlcData, loading: ohlcLoading, error: ohlcError } = useStockData(ticker || '');
  const { prediction, loading: predictionLoading } = usePrediction(ticker || '');
  const addHolding = usePortfolioStore((s) => s.addHolding);

  const handleAddToPortfolio = async () => {
    if (!ticker || !entryPrice) return;
    await addHolding({ ticker, quantity, entry_price: entryPrice });
    setShowAddModal(false);
  };

  if (!ticker) {
    return (
      <div className="flex flex-col">
        <Header title="Stock Detail" subtitle="AI Stock Analysis" />
        <div className="flex flex-col items-center justify-center gap-6 p-12 text-center">
          <AlertTriangle size={48} color="var(--color-text-muted)" />
          <h2 className="text-xl font-semibold">No Stock Selected</h2>
          <p className="text-sm max-w-md">
            Click on a stock from the Dashboard or search for a ticker to view its AI analysis.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title={ticker} subtitle="AI Stock Analysis" />
      <div className="flex flex-col gap-8">
        {ohlcLoading ? (
          <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card">
            <Spinner label="Loading chart data..." />
          </div>
        ) : ohlcError ? (
          <div className="bg-bg-card border border-border-alert rounded-2xl p-6 shadow-card flex flex-col items-center gap-4">
            <p className="text-sm text-bearish">Error loading data: {ohlcError}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <>
            <CurrentSnapshot ticker={ticker} ohlcData={ohlcData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIPrediction
                prediction={prediction}
                loading={predictionLoading}
                currentPrice={ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 0}
              />
              <TechnicalIndicators indicators={null} loading={false} />
            </div>

            {ohlcData.length > 0 ? (
              <div className="bg-bg-card border border-border-color rounded-2xl p-0 shadow-card overflow-hidden">
                <CandlestickChart data={ohlcData} height={400} />
                <VolumeChart data={ohlcData} height={120} />
              </div>
            ) : (
              <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card">
                <p className="text-xs text-text-secondary">No OHLC data available for {ticker}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add to Portfolio
              </Button>
            </div>
          </>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowAddModal(false)}>
            <div className="bg-bg-card border border-border-color rounded-2xl p-6 w-[400px] max-w-[90%] shadow-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold">Add {ticker} to Portfolio</h3>
              <div className="flex flex-col gap-4 mt-6">
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
                  <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleAddToPortfolio}>Add</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
