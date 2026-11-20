import Link from "next/link";
import { Plus } from "lucide-react";

import { InfoCard, InfoPage } from "@/features/company/info-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Support",
  description: "Answers to common questions about playback, accounts and your data.",
  path: "/support",
});

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "The video won't start, or shows a black screen",
    a: (
      <>
        Switch source using the buttons under the player (Primary, SuperEmbed, VidSrc), or press
        Reload. Each source is a different provider, so when one is down another usually works. You
        can set which one opens first in <Link href="/settings">Settings</Link>.
      </>
    ),
  },
  {
    q: "A brand-new episode isn't playing",
    a: "Providers often need a day or two after an episode airs before it is available. Try another source, or come back later.",
  },
  {
    q: "A title says “Not released”",
    a: "Its release date is in the future, so there is nothing to play yet. It unlocks by itself on release day.",
  },
  {
    q: "My progress or watched ticks aren't saved",
    a: (
      <>
        Progress is saved to your account, so you need to be signed in. Resume and progress bars
        come from the Primary source; the others can&apos;t report where you stopped. An episode
        counts as watched after about 45 seconds on it.
      </>
    ),
  },
  {
    q: "The wrong episode plays for an anime",
    a: "Use the Anime source, which is the default on anime pages. Other sources number long-running anime differently and can land on the wrong episode.",
  },
  {
    q: "I can't sign in",
    a: "Sign-in uses your Google account. If Google shows an error, try again in a private window or after clearing cookies for this site. Everything except your personal library works without signing in.",
  },
  {
    q: "How do I delete my history or favourites?",
    a: (
      <>
        Open <Link href="/settings">Settings</Link> and use Clear under Your data. It is immediate
        and can&apos;t be undone.
      </>
    ),
  },
  {
    q: "I see pop-ups or ads inside the player",
    a: "Those come from the third-party player, not from Popcornly, and we can't remove them. Close any new tab they open and never install anything they offer. Another source may show fewer.",
  },
];

export default function SupportPage() {
  return (
    <InfoPage
      current="/support"
      title="Support"
      intro="Quick answers to the things that most often go wrong."
    >
      <div className="border-t border-white/[0.08]">
        {FAQ.map(({ q, a }) => (
          // Native <details>: opens with a click or the keyboard, no script.
          <details key={q} className="group border-b border-white/[0.08]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-medium text-white/85 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
              {q}
              <Plus
                className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-open:rotate-45 group-open:text-primary"
                aria-hidden
              />
            </summary>
            <div className="max-w-2xl pb-6 text-[15px] leading-relaxed text-white/60 [&_a]:text-white [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-4">
              {a}
            </div>
          </details>
        ))}
      </div>

      {/* The list above ends on a line; the first section must not add its own. */}
      <div className="pt-2 [&>section:first-child]:border-t-0">
      <InfoCard title="Still stuck?">
        <p>
          Most playback problems are on the provider&apos;s side and clear up by switching source.
          For questions about your data, see <Link href="/privacy">Privacy</Link>.
        </p>
      </InfoCard>
      </div>
    </InfoPage>
  );
}
