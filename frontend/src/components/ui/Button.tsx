interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-accent-primary text-bg-primary hover:shadow-glow',
    secondary: 'bg-bg-hover text-text-primary border border-border-color hover:border-accent-primary',
    danger: 'bg-bearish-bg text-bearish border border-bearish hover:bg-bearish hover:text-text-primary',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
