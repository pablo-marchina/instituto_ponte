import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { secondsUntil, useServerTimer } from "./useServerTimer";

afterEach(() => vi.useRealTimers());

describe("useServerTimer", () => {
  it("calcula segundos restantes com base no servidor", () => {
    expect(secondsUntil("2026-06-15T12:00:10.000Z", new Date("2026-06-15T12:00:00.000Z").getTime())).toBe(10);
    expect(secondsUntil(null)).toBe(0);
  });

  it("avisa e expira apenas uma vez", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
    const onWarning = vi.fn();
    const onExpire = vi.fn();
    const { result } = renderHook(() => useServerTimer("2026-06-15T12:00:02.000Z", { warningAt: 2, onWarning, onExpire }));
    expect(result.current).toBe(2);
    expect(onWarning).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(3_000));
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
