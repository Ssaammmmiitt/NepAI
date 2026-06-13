import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BrandMark } from '@/components/layout/BrandMark'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase, end: false },
]

export function Sidebar() {
  const { user, signOut } = useAuthStore()

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-dt-border bg-dt-surface lg:flex xl:w-60">
        <div className="shrink-0 border-b border-dt-border px-4 py-3 xl:px-5 xl:py-4">
          <BrandMark />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex cursor-pointer items-center gap-3 border px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.06em] ${
                      isActive
                        ? 'border-dt-accent-bright bg-dt-accent-bright/10 text-dt-accent-bright'
                        : 'border-transparent text-dt-meta hover:border-dt-border hover:bg-dt-bg hover:text-dt-text'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-dt-border bg-dt-surface p-3">
          <ThemeToggle className="mb-3 w-full justify-center" />

          {user ? (
            <div className="mb-3 border border-dt-border px-3 py-2">
              <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-dt-text">
                {user.full_name}
              </p>
              <p className="truncate text-[10px] text-dt-meta">{user.email}</p>
            </div>
          ) : null}

          <Button variant="ghost" className="w-full !justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-dt-border bg-dt-surface px-4 py-3 lg:hidden">
        <BrandMark size="sm" />
        <ThemeToggle showLabel={false} />
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-dt-border bg-dt-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 font-mono text-[9px] uppercase tracking-[0.06em] ${
                isActive ? 'text-dt-accent-bright' : 'text-dt-meta'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            <span className="truncate px-1">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={signOut}
          className="flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 font-mono text-[9px] uppercase tracking-[0.06em] text-dt-meta"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Out
        </button>
      </nav>
    </>
  )
}
