"use client";

import { Play, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/**
 * Trailer button + modal.
 *
 * Uses the native `<dialog>` element rather than adding a modal library: it
 * gives us the top-layer, the backdrop, focus trapping and Escape-to-close for
 * free. The iframe is only mounted while open, so the page never loads a
 * YouTube player for a trailer nobody watched.
 */
export function TrailerDialog({
  youtubeKey,
  title,
}: {
  youtubeKey: string;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback(() => {
    setOpen(true);
    ref.current?.showModal();
  }, []);

  const hide = useCallback(() => {
    ref.current?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.12]"
      >
        <Play className="h-4 w-4" />
        Watch Trailer
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        // `backdrop:` is Tailwind's variant for the `::backdrop` pseudo-element.
        className="w-[min(96vw,1100px)] rounded-2xl border border-white/[0.1] bg-[#0b0b0d] p-0 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        aria-label={`${title} trailer`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <h2 className="truncate text-sm font-semibold">{title} — Trailer</h2>
          <button
            type="button"
            onClick={hide}
            aria-label="Close trailer"
            className="rounded-full p-1.5 text-white/70 transition hover:bg-white/[0.1] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-b-2xl bg-black">
          {open ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
