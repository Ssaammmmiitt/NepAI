interface BadgeProps {
  variant?: 'bullish' | 'bearish' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const variants = {
    bullish: 'bg-bullish-bg text-bullish',
    bearish: 'bg-bearish-bg text-bearish',
    neutral: 'bg-bg-hover text-text-secondary',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${variants[variant]}`}>
      {children}
    </span>
  );
}
