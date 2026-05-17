import type { Prediction } from '../../types';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Target, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import './AIPrediction.css';

interface AIPredictionProps {
  prediction: Prediction | null;
  loading: boolean;
  currentPrice: number;
}

export function AIPrediction({ prediction, loading, currentPrice }: AIPredictionProps) {
  if (loading) {
    return <div className="card ai-prediction"><div className="skeleton skeleton-md" /></div>;
  }

  if (!prediction) {
    return <div className="card ai-prediction"><p className="text-caption">No prediction data available</p></div>;
  }

  const dayChange = ((prediction.next_day.price - currentPrice) / currentPrice) * 100;
  const weekChange = ((prediction.next_week.price - currentPrice) / currentPrice) * 100;
  const dayBullish = dayChange >= 0;
  const weekBullish = weekChange >= 0;

  const hoursAgo = Math.round((Date.now() - new Date(prediction.generated_at).getTime()) / 3600000);

  return (
    <div className="card ai-prediction">
      <div className="ai-header">
        <Target size={20} color="var(--accent-primary)" />
        <h3 className="text-heading">🤖 AI Price Prediction</h3>
      </div>
      <div className="ai-model-info">
        <Clock size={14} color="var(--text-secondary)" />
        <span className="text-caption">
          Model Accuracy: {(prediction.model_accuracy * 100).toFixed(1)}% — Trained {hoursAgo}h ago
        </span>
      </div>
      <div className="ai-predictions">
        <div className="ai-prediction-item">
          <div className="ai-prediction-label">
            <span className="text-caption">Next Day Target</span>
            {dayBullish ? <ArrowUpRight size={16} color="var(--color-bullish)" /> : <ArrowDownRight size={16} color="var(--color-bearish)" />}
          </div>
          <div className="ai-prediction-value">
            <span className="text-kpi text-price">{formatPrice(prediction.next_day.price)}</span>
            <span className={`badge ${dayBullish ? 'badge-bullish' : 'badge-bearish'}`}>
              {formatPercent(dayChange)}
            </span>
          </div>
          <span className="text-caption">
            Range: {formatPrice(prediction.next_day.confidence_low)} — {formatPrice(prediction.next_day.confidence_high)}
          </span>
        </div>
        <div className="ai-prediction-item">
          <div className="ai-prediction-label">
            <span className="text-caption">Next Week Target</span>
            {weekBullish ? <ArrowUpRight size={16} color="var(--color-bullish)" /> : <ArrowDownRight size={16} color="var(--color-bearish)" />}
          </div>
          <div className="ai-prediction-value">
            <span className="text-kpi text-price">{formatPrice(prediction.next_week.price)}</span>
            <span className={`badge ${weekBullish ? 'badge-bullish' : 'badge-bearish'}`}>
              {formatPercent(weekChange)}
            </span>
          </div>
          <span className="text-caption">
            Range: {formatPrice(prediction.next_week.confidence_low)} — {formatPrice(prediction.next_week.confidence_high)}
          </span>
        </div>
      </div>
    </div>
  );
}
