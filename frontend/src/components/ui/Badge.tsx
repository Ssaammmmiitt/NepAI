import './Badge.css';

interface BadgeProps {
  variant?: 'bullish' | 'bearish' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
