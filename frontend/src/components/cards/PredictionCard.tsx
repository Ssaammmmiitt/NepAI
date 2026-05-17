import type { Prediction } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction | null;
  loading: boolean;
}

export function PredictionCard({ prediction, loading }: PredictionCardProps) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <div className="h-6 bg-bg-hover rounded-lg animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-bg-hover/25 via-bg-card to-bg-hover/25" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow">
        <p className="text-xs text-text-secondary">No prediction data available</p>
      </div>
    );
  }

  const dayChange = prediction.next_day.price - prediction.next_day.confidence_low;
  const dayDirection = dayChange >= 0 ? 'up' : 'down';

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Calendar size={16} color="var(--color-accent-primary)" />
        <span className="text-xl font-semibold">Predictions</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Next Day</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl">{formatPrice(prediction.next_day.price)}</span>
            {dayDirection === 'up' ? (
              <ArrowUpRight size={18} color="var(--color-bullish)" />
            ) : (
              <ArrowDownRight size={18} color="var(--color-bearish)" />
            )}
          </div>
          <span className="text-xs text-text-secondary">
            {formatPrice(prediction.next_day.confidence_low)} — {formatPrice(prediction.next_day.confidence_high)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">Next Week</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl">{formatPrice(prediction.next_week.price)}</span>
          </div>
          <span className="text-xs text-text-secondary">
            {formatPrice(prediction.next_week.confidence_low)} — {formatPrice(prediction.next_week.confidence_high)}
          </span>
        </div>
      </div>
    </div>
  );
}
