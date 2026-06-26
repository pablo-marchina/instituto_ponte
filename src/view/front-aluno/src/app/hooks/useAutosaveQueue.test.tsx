import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutosaveQueue } from "./useAutosaveQueue";

afterEach(() => vi.useRealTimers());

describe("useAutosaveQueue", () => {
  it("debounce por questao e cancela timeout anterior", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const { result } = renderHook(() => useAutosaveQueue());
    act(() => {
      result.current("q1", first, 800);
      result.current("q1", second, 800);
      vi.advanceTimersByTime(800);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
