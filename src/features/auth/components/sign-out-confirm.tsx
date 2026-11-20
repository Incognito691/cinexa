"use client";

import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/sign-out";

/**
 * A button that asks "Sign out?" in a small modal before doing it.
 *
 * Replaces the link to Auth.js's built-in `/api/auth/signout` page, which is
 * unbranded and a whole navigation for a one-click confirmation. Native
 * `<dialog>`: it traps focus, closes on Escape and sits above everything
 * without a modal library. The sign-out itself is a server action.
 */
export function SignOutConfirm({
  children,
  className,
  label,
  title,
}: {
  /** The trigger's content. */
  children: React.ReactNode;
  className?: string;
  /** Accessible name, for icon-only triggers. */
  label?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={title}
        className={className}
        onClick={() => ref.current?.showModal()}
      >
        {children}
      </button>

      <dialog
        ref={ref}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close();
        }}
        className="w-[min(92vw,360px)] rounded-2xl border border-white/[0.1] bg-[#111113] p-0 text-left text-white shadow-2xl shadow-black/70 backdrop:bg-black/70 open:animate-in open:fade-in open:zoom-in-95 open:duration-150"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Sign out?</h2>
            <p className="text-sm leading-relaxed text-white/55">
              Your history, favourites and collection stay saved for when you sign back in.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => startTransition(() => signOutAction())}>
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
