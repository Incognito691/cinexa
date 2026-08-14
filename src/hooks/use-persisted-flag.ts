"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe persisted boolean stored in localStorage.
 * Reads on mount, writes on change. Returns `defaultValue` during SSR + first paint.
 */
export function usePersistedFlag(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(raw === "1");
    } catch {
      // ignore (private mode, etc.)
    }
    }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}