import { NextResponse } from "next/server";
import type { ApiError } from "@/types/api";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400) {
  const body: ApiError = { ok: false, error: message };
  return NextResponse.json(body, { status });
}