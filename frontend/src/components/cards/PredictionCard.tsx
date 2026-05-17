import type { Prediction } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import './PredictionCard.css';

interface PredictionCardProps {
  prediction: Prediction | null;
  loading: boolean;
}

export function PredictionCard({ prediction, loading }: PredictionCardProps) {
  if (loading) {
    return <div className="card prediction-card"><div className="skeleton skeleton-sm" /></div>;
  }

  if (!prediction) {
    return <div className="card prediction-card"><p className="text-caption">No prediction data available</p></div>;
  }

  const dayChange = prediction.next_day.price - prediction.next_day.confidence_low;
  const dayDirection = dayChange >= 0 ? 'up' : 'down';

  return (
    <div className="card prediction-card">
      <div className="prediction-header">
        <Calendar size={16} color="var(--accent-primary)" />
        <span className="text-heading">Predictions</span>
      </div>
      <div className="prediction-grid">
        <div className="prediction-item">
          <span className="text-caption">Next Day</span>
          <div className="prediction-value">
            <span className="text-kpi text-price">{formatPrice(prediction.next_day.price)}</span>
            {dayDirection === 'up' ? <ArrowUpRight size={18} color="var(--color-bullish)" /> : <ArrowDownRight size={18} color="var(--color-bearish)" />}
          </div>
          <span className="text-caption">
            {formatPrice(prediction.next_day.confidence_low)} — {formatPrice(prediction.next_day.confidence_high)}
          </span>
        </div>
        <div className="prediction-item">
          <span className="text-caption">Next Week</span>
          <div className="prediction-value">
            <span className="text-kpi text-price">{formatPrice(prediction.next_week.price)}</span>
          </div>
          <span className="text-caption">
            {formatPrice(prediction.next_week.confidence_low)} — {formatPrice(prediction.next_week.confidence_high)}
          </span>
        </div>
      </div>
    </div>
  );
}
