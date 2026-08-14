import { AiComingSoon } from "@/features/ai";
import { buildMetadata } from "@/lib/metadata";

// noIndex while it's an empty state — nothing here is worth a search result
// yet. Drop the flag once the chat actually works.
export const metadata = buildMetadata({
  title: "AI Chat",
  description:
    "Movie recommendations drawn from your watch history, and a conversation about genres, themes, and plots. Coming soon to Cinexa.",
  path: "/ai",
  noIndex: true,
});

export default function AiPage() {
  return <AiComingSoon />;
}
