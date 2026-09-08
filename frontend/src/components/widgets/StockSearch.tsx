import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useStockStore } from '@/store/stockStore'

interface StockSearchProps {
  /** Called with the selected ticker. If omitted, navigates to /stock/:ticker */
  onSelect?: (ticker: string) => void
  placeholder?: string
}

export function StockSearch({ onSelect, placeholder = 'Search ticker or name...' }: StockSearchProps) {
  const navigate = useNavigate()
  const { tickers } = useStockStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toUpperCase()
    const ql = query.toLowerCase()
    return tickers
      .filter((t) => t.ticker.includes(q) || (t.stock_name?.toLowerCase().includes(ql) ?? false))
      .slice(0, 8)
  }, [tickers, query])

  const select = (ticker: string) => {
    setQuery('')
    setOpen(false)
    if (onSelect) {
      onSelect(ticker)
    } else {
      navigate(`/stock/${ticker}`)
    }
  }

  return (
    <div className="relative w-full max-w-full sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dt-meta" strokeWidth={1.5} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full border border-dt-border bg-dt-bg py-2 pl-9 pr-4 font-mono text-xs text-dt-text outline-none placeholder:text-dt-meta hover:border-dt-text focus:border-dt-text focus:shadow-[4px_4px_0_0_var(--dt-shadow)]"
        />
      </div>
      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-1.5 w-full min-w-full overflow-hidden border border-dt-border bg-dt-surface shadow-[4px_4px_0_0_var(--dt-shadow)]">
          {results.map((t) => (
            <li key={t.ticker}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-3 text-left hover:bg-dt-bg"
                onMouseDown={() => select(t.ticker)}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-medium text-dt-text block mb-0.5">
                    {t.ticker}
                  </span>
                  {t.stock_name ? (
                    <p className="text-[10px] leading-tight text-dt-meta whitespace-normal break-words">
                      {t.stock_name}
                    </p>
                  ) : null}
                </div>
                <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-dt-meta mt-0.5">
                  Rs {t.latest_close.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
