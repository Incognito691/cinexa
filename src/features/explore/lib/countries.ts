/**
 * Countries offered by "Browse by Country".
 *
 * ISO 3166-1 alpha-2 codes only — names come from `Intl.DisplayNames` and
 * flags from the regional-indicator code points, so there is nothing to keep
 * in sync and no extra fetch. The list is curated rather than TMDB's full
 * `/configuration/countries` (~250 entries): `with_origin_country=VA` returns
 * nothing, and a browse grid of empty results is worse than a shorter one.
 *
 * The first `FEATURED_COUNT` are what the collapsed grid shows; the rest are
 * alphabetical by code and only appear behind "Show all".
 */

export const FEATURED_COUNT = 6;

export const COUNTRY_CODES: readonly string[] = [
  // Featured — the six biggest producers by catalogue size.
  "US",
  "GB",
  "JP",
  "KR",
  "IN",
  "FR",
  // The rest.
  "AR",
  "AU",
  "BE",
  "BR",
  "CA",
  "CH",
  "CL",
  "CN",
  "CO",
  "CZ",
  "DE",
  "DK",
  "EG",
  "ES",
  "FI",
  "GR",
  "HK",
  "HU",
  "ID",
  "IE",
  "IL",
  "IR",
  "IS",
  "IT",
  "MX",
  "MY",
  "NG",
  "NL",
  "NO",
  "NP",
  "NZ",
  "PH",
  "PK",
  "PL",
  "PT",
  "RO",
  "RU",
  "SA",
  "SE",
  "SG",
  "TH",
  "TR",
  "TW",
  "UA",
  "VN",
  "ZA",
] as const;

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

/** "US" → "United States". Falls back to the raw code for anything unknown. */
export function countryName(code: string): string {
  return displayNames.of(code) ?? code;
}

/** "US" → "🇺🇸" — the two regional-indicator code points for the letters. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
