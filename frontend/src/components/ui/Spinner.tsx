import { Loader2 } from 'lucide-react';
import './Spinner.css';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 24, label }: SpinnerProps) {
  return (
    <div className="spinner" role="status">
      <Loader2 size={size} className="spinner-icon" />
      {label && <span className="text-caption spinner-label">{label}</span>}
    </div>
  );
}
