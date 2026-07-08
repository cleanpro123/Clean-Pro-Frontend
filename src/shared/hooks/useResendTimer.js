import { useState, useRef, useEffect, useCallback } from 'react';

// Cooldown gate for OTP "Resend" actions. Call start() right after a code is
// sent: `secondsLeft` ticks down from `duration` to 0 and `active` stays true
// until it reaches 0, so the UI can disable Resend and show the countdown.
export default function useResendTimer(duration = 60) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setSecondsLeft(duration);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [duration, stop]);

  const reset = useCallback(() => {
    stop();
    setSecondsLeft(0);
  }, [stop]);

  // Clear the interval if the screen unmounts mid-countdown.
  useEffect(() => stop, [stop]);

  return { secondsLeft, active: secondsLeft > 0, start, reset };
}
