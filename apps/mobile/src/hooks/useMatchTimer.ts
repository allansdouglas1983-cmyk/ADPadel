import { useEffect, useRef, useState } from 'react';

/**
 * A match clock that can be PAUSED for a medical timeout (FIP allows a fixed
 * rest; the app supports pausing so the clock reflects real playing time). Time
 * is derived from the start moment minus accumulated paused time, so it stays
 * correct across re-renders and app backgrounding.
 */
export function useMatchTimer(startMs: number) {
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const pausedTotal = useRef(0);
  const pausedAt = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const togglePause = () => {
    if (paused) {
      if (pausedAt.current != null) pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
    }
  };

  const activePausedMs = pausedAt.current != null ? Date.now() - pausedAt.current : 0;
  const elapsedSec = Math.max(0, Math.floor((now - startMs - pausedTotal.current - activePausedMs) / 1000));
  const label = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;

  return { elapsedSec, label, paused, togglePause };
}
