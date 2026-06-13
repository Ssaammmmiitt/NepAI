import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ToastContainer } from '@/components/ui/Toast'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { StockDetail } from '@/pages/StockDetail'
import { Portfolio } from '@/pages/Portfolio'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

function AppLayout() {
  return (
    <div className="min-h-screen bg-dt-bg">
      <Sidebar />
      <div className="flex min-h-screen flex-col pb-14 lg:ml-56 lg:pb-0 xl:ml-60">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="stock/:ticker" element={<StockDetail />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
