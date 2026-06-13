import { useEffect } from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'

export function usePortfolio() {
  const { holdings, loading, error, fetchPortfolio, addStock, removeStock } =
    usePortfolioStore()

  useEffect(() => {
    void fetchPortfolio()
  }, [fetchPortfolio])

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.current_price * h.quantity,
    0,
  )
  const totalCost = holdings.reduce((sum, h) => sum + h.entry_price * h.quantity, 0)
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0)
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return {
    holdings,
    loading,
    error,
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    addStock,
    removeStock,
    refetch: fetchPortfolio,
  }
}
