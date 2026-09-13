import { request } from "@/lib/fetcher";
import type { LibraryKeys } from "@/types/media";

/** Client half of `/api/library/keys`. */
export const fetchLibraryKeys = () =>
  request<LibraryKeys>("/api/library/keys");
