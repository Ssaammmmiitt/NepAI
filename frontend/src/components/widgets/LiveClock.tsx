import { useState, useEffect } from 'react';

const NEPAL_TZ = 'Asia/Kathmandu';

function formatNepaliDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: NEPAL_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNepaliTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: NEPAL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-bg-card border border-border-color rounded-xl">
      <div className="font-mono text-lg font-bold text-accent-primary">{formatNepaliTime(now)}</div>
      <div className="text-xs text-text-secondary">{formatNepaliDate(now)}</div>
      <span className="text-[10px] text-text-muted px-1.5 py-0.5 bg-bg-hover rounded-md">NPT (UTC+5:45)</span>
    </div>
  );
}
