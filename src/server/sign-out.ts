"use server";

import { signOut } from "@/auth";

/** Ends the session and returns to the home page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
