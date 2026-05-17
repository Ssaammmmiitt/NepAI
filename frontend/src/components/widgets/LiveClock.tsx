import { useState, useEffect } from 'react';
import './LiveClock.css';

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
    <div className="live-clock">
      <div className="live-clock-time">{formatNepaliTime(now)}</div>
      <div className="live-clock-date">{formatNepaliDate(now)}</div>
      <span className="live-clock-tz">NPT (UTC+5:45)</span>
    </div>
  );
}
