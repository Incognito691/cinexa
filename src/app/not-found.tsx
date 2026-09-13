import Link from "next/link";

import { buildMetadata } from "@/lib/metadata";

// Without this the 404 inherits the root title and description and is
// indexable — a soft-404 that search engines will happily list.
export const metadata = buildMetadata({
  title: "Not found",
  description: "That page or title isn’t available on Cinexa.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-white/40">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        We couldn&rsquo;t find that title
      </h1>
      <p className="max-w-md text-sm text-white/60">
        It may have been removed, or it isn&rsquo;t available here.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
