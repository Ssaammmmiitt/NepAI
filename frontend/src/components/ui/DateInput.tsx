import { useRef, type InputHTMLAttributes } from 'react'
import { Calendar } from 'lucide-react'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  } else {
    input.focus()
  }
}

export function DateInput({ label, id, className = '', value, onChange, ...props }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label
        htmlFor={inputId}
        className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.06em] text-dt-meta"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="date"
          value={value}
          onChange={onChange}
          onClick={(e) => openDatePicker(e.currentTarget)}
          className={`dt-date-input w-full min-w-[9.5rem] cursor-pointer border border-dt-border bg-dt-surface px-3 py-1.5 pr-9 font-mono text-xs text-dt-text outline-none hover:border-dt-text focus:border-dt-text ${className}`}
          {...props}
        />
        <Calendar
          className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dt-meta"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </div>
  )
}
