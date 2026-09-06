"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Without one, a throw in a server page takes the
 * whole shell down instead of leaving the sidebar and topbar usable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-white/60">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
