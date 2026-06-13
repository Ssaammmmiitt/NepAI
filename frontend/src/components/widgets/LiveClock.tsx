import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleString('en-NP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kathmandu',
        }),
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2 border border-dt-border bg-dt-bg px-3 py-1.5 font-mono text-xs text-dt-meta">
      <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="tabular-nums text-dt-text">{time}</span>
      <span>NPT</span>
    </div>
  )
}
