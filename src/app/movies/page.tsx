import { CataloguePage } from "@/features/catalogue/catalogue-page";
import { buildMetadata } from "@/lib/metadata";

// Same window as the home page: the rails are rebuilt on the server.
export const revalidate = 60;

export const metadata = buildMetadata({
  title: "Movies",
  description: "Trending, now playing, popular and top-rated movies, by genre.",
  path: "/movies",
});

export default function Page() {
  return <CataloguePage type="movie" />;
}
