interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden
      className={`shrink-0 ${sizes[size]} ${className}`}
    />
  )
}
