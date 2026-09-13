"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe persisted string in localStorage — the string sibling of
 * {@link usePersistedFlag}.
 *
 * Returns `defaultValue` during SSR and first paint, then swaps in the stored
 * value on mount. That means the first render is always the default, so
 * callers must tolerate a one-frame change rather than reading it as final.
 *
 * `allowed` guards against a stale or hand-edited value: a preference naming
 * a playback source that no longer exists should fall back, not break the
 * player.
 */
export function usePersistedString(
  key: string,
  defaultValue: string,
  allowed?: readonly string[],
) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null && (!allowed || allowed.includes(raw))) setValue(raw);
    } catch {
      // ignore (private mode, etc.)
    }
  }, [key]);

  /**
   * Writes only on a real choice, never on mount.
   *
   * An earlier version persisted `value` from a mount effect, which meant the
   * *default* got written to localStorage for every visitor who never touched
   * the control. Changing the default then had no effect on anyone who had
   * already loaded the page once — they were pinned to the old default
   * forever, with no way to tell a stored preference apart from an
   * accidentally-persisted one.
   */
  const persist = useCallback(
    (next: string) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // ignore
      }
    },
    [key],
  );

  return [value, persist] as const;
}
