/** "Black Clover Season 2" → "black-clover-season-2". Cosmetic: routes ignore it. */
export const animeSlug = (title: string) =>
  title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "anime";

/** The URL an anime card links to. */
export const animeHref = (id: number, title: string) => `/anime/${id}/${animeSlug(title)}`;
