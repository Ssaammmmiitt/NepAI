import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PageWrapper } from './components/layout/PageWrapper';
import { Spinner } from './components/ui/Spinner';
import { useThemeStore } from './store/themeStore';
import './App.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Suspense fallback={<div className="app-loading"><Spinner label="Loading..." /></div>}>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
