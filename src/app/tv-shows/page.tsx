import { CataloguePage } from "@/features/catalogue/catalogue-page";
import { buildMetadata } from "@/lib/metadata";

// Same window as the home page: the rails are rebuilt on the server.
export const revalidate = 60;

export const metadata = buildMetadata({
  title: "TV Shows",
  description: "Trending, on the air, popular and top-rated TV shows, by genre.",
  path: "/tv-shows",
});

export default function Page() {
  return <CataloguePage type="tv" />;
}
