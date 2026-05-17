import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Wallet, Activity } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stock', icon: TrendingUp, label: 'Stock Detail' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity size={24} color="var(--accent-primary)" />
        <span>NepAI</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
