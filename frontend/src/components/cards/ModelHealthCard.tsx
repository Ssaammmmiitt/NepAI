import { Target, CheckCircle2 } from 'lucide-react';

interface ModelHealthCardProps {
  accuracy: number;
  ticker: string;
}

export function ModelHealthCard({ accuracy, ticker }: ModelHealthCardProps) {
  const accuracyPercent = (accuracy * 100).toFixed(1);
  const isGood = accuracy >= 0.8;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-card transition-all duration-200 hover:border-border-glow flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Target size={16} color="var(--color-accent-primary)" />
        <span className="text-xl font-semibold">Model Health</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono font-bold text-2xl">{accuracyPercent}%</span>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={16} color={isGood ? 'var(--color-bullish)' : 'var(--color-chart-prediction)'} />
          <span className={`text-xs ${isGood ? 'text-bullish' : ''}`}>
            {isGood ? 'Good' : 'Fair'} — {ticker}
          </span>
        </div>
        <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${accuracyPercent}%`, backgroundColor: isGood ? 'var(--color-bullish)' : 'var(--color-chart-prediction)' }}
          />
        </div>
      </div>
    </div>
  );
}
