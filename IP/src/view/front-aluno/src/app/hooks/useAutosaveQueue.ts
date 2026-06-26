import { useEffect, useRef } from "react";

export function useAutosaveQueue() {
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const active = timeouts.current;
    return () => Object.values(active).forEach(clearTimeout);
  }, []);

  return (key: string, callback: () => void, delay: number) => {
    const existing = timeouts.current[key];
    if (existing) clearTimeout(existing);
    timeouts.current[key] = setTimeout(() => {
      delete timeouts.current[key];
      callback();
    }, delay);
  };
}
