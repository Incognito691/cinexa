import type { MediaCardItem } from "./media";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ListPayload {
  items: MediaCardItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}