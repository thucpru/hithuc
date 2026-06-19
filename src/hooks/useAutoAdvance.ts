import { useEffect, useRef, useState } from 'react';

interface UseAutoAdvanceProps {
  onAdvance: () => void;
  interval?: number;
  enabled?: boolean;
}

export function useAutoAdvance({
  onAdvance,
  interval = 4500,
  enabled = false,
}: UseAutoAdvanceProps) {
  const [isPlaying, setIsPlaying] = useState(enabled);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Start/stop auto-advance
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      onAdvance();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, onAdvance, interval]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);
  const stop = () => {
    setIsPlaying(false);
    setIsPaused(false);
  };

  return {
    isPlaying,
    isPaused,
    play,
    pause,
    resume,
    stop,
  };
}
