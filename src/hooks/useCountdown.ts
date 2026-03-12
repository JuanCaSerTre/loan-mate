/**
 * LoanMate — useCountdown Hook
 * Reusable countdown timer for OTP resend and other timed actions.
 */
import { useState, useEffect, useCallback, useRef } from "react";

interface UseCountdownReturn {
  seconds: number;
  isActive: boolean;
  start: (duration?: number) => void;
  reset: () => void;
}

export function useCountdown(initialSeconds: number = 60): UseCountdownReturn {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (duration: number = initialSeconds) => {
      clear();
      setSeconds(duration);
      setIsActive(true);

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clear();
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds, clear]
  );

  const reset = useCallback(() => {
    clear();
    setSeconds(0);
    setIsActive(false);
  }, [clear]);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return { seconds, isActive, start, reset };
}
