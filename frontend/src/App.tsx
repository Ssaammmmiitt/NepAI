import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PageWrapper } from './components/layout/PageWrapper';
import { Spinner } from './components/ui/Spinner';
import { useThemeStore } from './store/themeStore';
import { LayoutDashboard, TrendingUp, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './App.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stock', icon: TrendingUp, label: 'Stocks' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
];

function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner label="Loading..." /></div>}>
            <PageWrapper>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stock" element={<StockDetail />} />
                <Route path="/stock/:ticker" element={<StockDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
              </Routes>
            </PageWrapper>
          </Suspense>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-color flex items-center justify-around px-4 py-2 z-50">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 no-underline ${
                  isActive
                    ? 'text-accent-primary'
                    : 'text-text-secondary'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
