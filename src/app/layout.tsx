import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { UserMenu } from "@/features/auth/components/user-menu";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession } from "@/server/session";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/metadata";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Root metadata. `metadataBase` makes every relative OG/canonical URL in a
 * child page resolve to an absolute one, and the title template means pages
 * only declare their own title ("Explore" renders as "Explore · Popcornly").
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["movies", "tv shows", "streaming", "anime", "watch online", "trending"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// themeColor / colorScheme moved out of `metadata` in Next 14+.
export const viewport: Viewport = {
  themeColor: "#090909",
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Shared with `UserMenu` through `getSession`'s per-request cache: one lookup.
  const signedIn = Boolean((await getSession())?.user);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <NavigationProgress />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider delayDuration={150}>
              <AppShell userMenu={<UserMenu />} signedIn={signedIn}>
                {children}
              </AppShell>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
        {/* Vercel Web Analytics: page views per route, no cookies. Only
            reports on Vercel deployments; a no-op in local dev. */}
        <Analytics />
      </body>
    </html>
  );
}