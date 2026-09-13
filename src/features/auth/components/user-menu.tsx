import Image from "next/image";
import { LogIn } from "lucide-react";

import { auth, signIn } from "@/auth";
import { authConfigured } from "@/lib/env";

/**
 * Sign-in / sign-out control for the topbar.
 *
 * A server component so it can read the session directly — no `SessionProvider`
 * and no client-side session fetch on every page.
 *
 * Login is optional: signed-out visitors see a plain "Sign in" button and every
 * other feature keeps working, so nothing here should ever block rendering.
 * When OAuth isn't configured the control disappears entirely rather than
 * offering a button that would 500.
 */
export async function UserMenu() {
  if (!authConfigured()) return null;

  const session = await auth().catch(() => null);
  const user = session?.user;

  if (!user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 text-sm font-medium text-foreground/85 backdrop-blur-md transition hover:bg-white/[0.1] hover:text-foreground"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Sign in
        </button>
      </form>
    );
  }

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  // Avatar only — signing out is the sidebar's Logout row.
  return user.image ? (
    <Image
      src={user.image}
      alt={user.name ?? "Account"}
      title={user.email ?? undefined}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full border border-white/[0.12] object-cover"
    />
  ) : (
    <span
      title={user.email ?? undefined}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white"
    >
      {initial}
    </span>
  );
}
