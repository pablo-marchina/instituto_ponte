import { useEffect, useRef, useState } from "react";

const secondsUntil = (deadline: string | null, now = Date.now()) =>
  deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000)) : 0;

export function useServerTimer(
  deadline: string | null,
  options: { warningAt: number; onWarning: () => void; onExpire: () => void },
) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(deadline));
  const warningShown = useRef(false);
  const expirationHandled = useRef(false);
  const callbacks = useRef(options);

  useEffect(() => {
    callbacks.current = options;
  }, [options]);

  useEffect(() => {
    warningShown.current = false;
    expirationHandled.current = false;
    const update = () => {
      const next = secondsUntil(deadline);
      setSecondsLeft(next);
      if (next > 0 && next <= callbacks.current.warningAt && !warningShown.current) {
        warningShown.current = true;
        callbacks.current.onWarning();
      }
      if (deadline && next === 0 && !expirationHandled.current) {
        expirationHandled.current = true;
        callbacks.current.onExpire();
      }
    };

    update();
    if (!deadline) return;
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return secondsLeft;
}

export { secondsUntil };
