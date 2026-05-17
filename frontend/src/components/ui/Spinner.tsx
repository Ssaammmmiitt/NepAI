import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 24, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2" role="status">
      <Loader2 size={size} className="animate-spin text-accent-primary" />
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </div>
  );
}
