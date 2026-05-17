import { Target, CheckCircle2 } from 'lucide-react';
import './ModelHealthCard.css';

interface ModelHealthCardProps {
  accuracy: number;
  ticker: string;
}

export function ModelHealthCard({ accuracy, ticker }: ModelHealthCardProps) {
  const accuracyPercent = (accuracy * 100).toFixed(1);
  const isGood = accuracy >= 0.8;

  return (
    <div className="card model-health-card">
      <div className="model-health-header">
        <Target size={16} color="var(--accent-primary)" />
        <span className="text-heading">Model Health</span>
      </div>
      <div className="model-health-body">
        <span className="text-kpi text-price">{accuracyPercent}%</span>
        <div className="model-health-status">
          {isGood ? (
            <CheckCircle2 size={16} color="var(--color-bullish)" />
          ) : (
            <CheckCircle2 size={16} color="var(--chart-prediction)" />
          )}
          <span className={`text-caption ${isGood ? 'text-bullish' : ''}`}>
            {isGood ? 'Good' : 'Fair'} — {ticker}
          </span>
        </div>
        <div className="model-health-bar">
          <div
            className="model-health-bar-fill"
            style={{ width: `${accuracyPercent}%`, backgroundColor: isGood ? 'var(--color-bullish)' : 'var(--chart-prediction)' }}
          />
        </div>
      </div>
    </div>
  );
}
