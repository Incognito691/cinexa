import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/lib/env";
import { prisma } from "@/server/db";

/**
 * Auth.js v5 configuration.
 *
 * Login is **optional** — browsing and playback stay public. A session only
 * unlocks the personal features (watch history today; favourites and
 * collections next), so nothing here should be used to gate a page.
 *
 * Credentials are passed explicitly rather than relying on Auth.js's env
 * autodiscovery, which looks for `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` while
 * this project stores them under the `GOOGLE_*` names.
 *
 * Session strategy is `database`: the Prisma adapter is already storing users
 * and accounts, and a DB session means signing out actually invalidates rather
 * than waiting for a JWT to expire.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // The default session shape omits the user id, which every watch-history
    // query needs.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
