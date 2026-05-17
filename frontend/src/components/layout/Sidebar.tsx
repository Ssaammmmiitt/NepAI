import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, Activity } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stock', icon: TrendingUp, label: 'Stock Detail' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 bg-bg-secondary border-r border-border-color p-6 gap-6 flex-shrink-0">
      <div className="flex items-center gap-2.5 text-2xl font-bold text-accent-primary">
        <Activity size={24} color="var(--color-accent-primary)" />
        <span>NepAI</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                isActive
                  ? 'bg-accent-primary-glow text-accent-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
