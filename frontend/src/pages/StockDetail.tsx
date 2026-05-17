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
import { useIndicators } from '../hooks/useIndicators';
import { usePrediction } from '../hooks/usePrediction';
import { usePortfolioStore } from '../store/portfolioStore';
import { Plus, AlertTriangle } from 'lucide-react';
import './StockDetail.css';

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [entryPrice, setEntryPrice] = useState(0);

  const { data: ohlcData, loading: ohlcLoading, error: ohlcError } = useStockData(ticker || '');
  const { indicators, loading: indicatorsLoading } = useIndicators(ticker || '');
  const { prediction, loading: predictionLoading } = usePrediction(ticker || '');
  const addHolding = usePortfolioStore((s) => s.addHolding);

  const handleAddToPortfolio = async () => {
    if (!ticker || !entryPrice) return;
    await addHolding({ ticker, quantity, entry_price: entryPrice });
    setShowAddModal(false);
  };

  if (!ticker) {
    return (
      <div className="stock-detail-empty">
        <Header title="Stock Detail" subtitle="AI Stock Analysis" />
        <div className="stock-detail-empty-content">
          <AlertTriangle size={48} color="var(--text-muted)" />
          <h2 className="text-heading">No Stock Selected</h2>
          <p className="text-body">Click on a stock from the Dashboard or search for a ticker to view its AI analysis.</p>
          <Button variant="primary" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title={ticker} subtitle="AI Stock Analysis" />
      <div className="stock-detail-content">
        {ohlcLoading ? (
          <div className="card">
            <Spinner label="Loading chart data..." />
          </div>
        ) : ohlcError ? (
          <div className="card error-card">
            <p className="text-body text-bearish">Error loading data: {ohlcError}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <CurrentSnapshot ticker={ticker} ohlcData={ohlcData} />

            <div className="stock-detail-grid">
              <AIPrediction
                prediction={prediction}
                loading={predictionLoading}
                currentPrice={ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 0}
              />
              <TechnicalIndicators indicators={indicators} loading={indicatorsLoading} />
            </div>

            {ohlcData.length > 0 ? (
              <div className="stock-detail-charts">
                <div className="card chart-container">
                  <CandlestickChart data={ohlcData} height={400} />
                  <VolumeChart data={ohlcData} height={120} />
                </div>
              </div>
            ) : (
              <div className="card">
                <p className="text-caption">No OHLC data available for {ticker}</p>
              </div>
            )}

            <div className="stock-detail-actions">
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add to Portfolio
              </Button>
            </div>
          </>
        )}

        {showAddModal && (
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-heading">Add {ticker} to Portfolio</h3>
              <div className="modal-form">
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
                  <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAddToPortfolio}>
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
