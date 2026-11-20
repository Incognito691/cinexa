import Link from "next/link";

import { InfoCard, InfoPage } from "@/features/company/info-page";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Privacy",
  description: "What Popcornly stores, where, and how to delete it.",
  path: "/privacy",
});

/*
 * Keep this page true to the code. If what is stored changes (prisma/schema,
 * the localStorage keys, analytics, the player providers), update it here.
 */
export default function PrivacyPage() {
  return (
    <InfoPage
      current="/privacy"
      title="Privacy"
      intro="What Popcornly stores about you, where it lives, and how to remove it. In plain language."
      updated="November 20, 2026"
    >
      <InfoCard title="If you don't sign in">
        <p>
          Nothing about you is saved on our servers. Two preferences are kept in your own browser:
          whether the sidebar is open, and which player source you chose as your default.
        </p>
      </InfoCard>

      <InfoCard title="If you sign in">
        <p>Sign-in is through Google. We receive and store:</p>
        <ul>
          <li>
            <strong>Your Google profile basics:</strong> name, email address and profile picture.
          </li>
          <li>
            <strong>Watch history:</strong> which titles and episodes you opened, when, and how far
            you got.
          </li>
          <li>
            <strong>Favourites and collections:</strong> the titles you saved and the folders you
            made.
          </li>
          <li>
            <strong>A session record,</strong> so you stay signed in. It is kept in a cookie on your
            device and matched to our database.
          </li>
        </ul>
        <p>We never see your Google password, and we don&apos;t sell or share this data.</p>
      </InfoCard>

      <InfoCard title="Analytics">
        <p>
          We use Vercel Web Analytics to count page views. It does not use cookies and is designed
          not to identify individual visitors.
        </p>
      </InfoCard>

      <InfoCard title="Other companies involved">
        <ul>
          <li>
            <strong>Video players</strong> are embedded from third-party providers. They run their
            own code inside the player, may show their own ads, and may set their own cookies. We
            don&apos;t control that, and their own policies apply.
          </li>
          <li>
            <strong>Images and listings</strong> load from TMDB and AniList, so those services see
            the request your browser makes for them.
          </li>
          <li>
            <strong>Hosting and database:</strong> the site runs on Vercel and stores account data
            in a hosted Postgres database.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Deleting your data">
        <p>
          In <Link href="/settings">Settings</Link>, under Your data, you can clear your watch
          history, favourites and collection at any time. Clearing is immediate and permanent.
          Signing out ends your session on this device.
        </p>
      </InfoCard>

      <InfoCard title="Changes">
        <p>
          If what we store changes, this page will be updated and the date at the top will change
          with it.
        </p>
      </InfoCard>
    </InfoPage>
  );
}
