import { useEffect, useRef } from 'react';

const SOUND_URL = '/sounds/ps2-select.mp3';

export function useClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 0.5;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isButton =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input[type="submit"]');

      if (isButton) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}
