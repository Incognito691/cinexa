import Link from "next/link";

import { InfoCard, InfoPage } from "@/features/company/info-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Terms",
  description: "The terms for using Popcornly.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <InfoPage
      current="/terms"
      title="Terms of use"
      intro="The short version: use Popcornly as it's meant to be used, and understand what it is and isn't."
      updated="November 20, 2026"
    >
      <InfoCard title="What Popcornly is">
        <p>
          Popcornly is a catalogue and interface for discovering movies, TV shows and anime. It does
          not host, upload or store any video. Players are embedded from third-party providers, and
          information about titles comes from TMDB and AniList.
        </p>
      </InfoCard>

      <InfoCard title="Third-party content">
        <p>
          Because the players and the streams belong to other services, we can&apos;t guarantee that
          any title is available, accurate, complete or uninterrupted. Those providers may show
          their own ads. You are responsible for making sure that what you watch is lawful where you
          live.
        </p>
      </InfoCard>

      <InfoCard title="Your account">
        <p>
          An account is optional. If you sign in, keep access to your Google account secure; you are
          responsible for activity under it. You can clear your saved data at any time in{" "}
          <Link href="/settings">Settings</Link>.
        </p>
      </InfoCard>

      <InfoCard title="Acceptable use">
        <ul>
          <li>Don&apos;t try to break, overload or gain unauthorised access to the site.</li>
          <li>Don&apos;t scrape it in bulk or use it to build a competing copy.</li>
          <li>Don&apos;t try to get around the content filter.</li>
        </ul>
      </InfoCard>

      <InfoCard title="No warranty">
        <p>
          Popcornly is provided as it is, without guarantees of any kind. To the extent the law
          allows, we are not liable for loss or damage arising from using it, or from third-party
          players and the content they serve.
        </p>
      </InfoCard>

      <InfoCard title="Changes to these terms">
        <p>
          We may update these terms; the date at the top shows the latest version. Continuing to
          use Popcornly after a change means you accept it. See also the{" "}
          <Link href="/privacy">Privacy</Link> page.
        </p>
      </InfoCard>
    </InfoPage>
  );
}
