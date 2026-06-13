import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrandMark } from '@/components/layout/BrandMark'

interface PublicHeaderProps {
  subtitle?: string
}

export function PublicHeader({ subtitle }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-dt-border bg-dt-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <BrandMark subtitle={subtitle} linkWhenAway={false} />
        <ThemeToggle showLabel={false} />
      </div>
    </header>
  )
}
