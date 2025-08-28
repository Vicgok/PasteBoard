/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useMemo, useCallback, useRef, useEffect } from "react";

// HOC for memoizing components with custom comparison
export function withMemoization<T extends object>(
  Component: React.ComponentType<T>,
  compareProps?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, compareProps);
}

// Custom hook for stable object references
export function useStableObject<T extends Record<string, unknown>>(obj: T): T {
  const keys = Object.keys(obj).sort();
  const values = keys.map((key) => obj[key]);

  return useMemo(() => obj, values);
}

// Custom hook for stable array references
export function useStableArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, [JSON.stringify(arr)]);
}

// Custom hook for callback memoization with dependencies
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Custom hook for preventing unnecessary re-renders
export function useShallowMemo<T>(value: T): T {
  const ref = useRef<T>(value);

  if (JSON.stringify(ref.current) !== JSON.stringify(value)) {
    ref.current = value;
  }

  return ref.current;
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const renderCount = useRef(0);
  const lastRender = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRender.current;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔍 ${name} - Render #${
          renderCount.current
        } (${timeSinceLastRender.toFixed(2)}ms since last)`
      );
    }

    lastRender.current = now;
  });

  return renderCount.current;
}
