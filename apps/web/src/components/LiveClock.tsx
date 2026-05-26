'use client';

import { useEffect, useState } from 'react';

export function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString('en-AU', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).toUpperCase()
      );
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="font-mono text-xl font-semibold text-accent tabular-nums">
        {time}
      </div>
      <div className="font-mono text-xs text-text-dim tracking-widest">
        {date}
      </div>
    </div>
  );
}
