import { NextResponse } from "next/server";

/**
 * Minimal in-memory, per-IP token bucket. Good enough for a single instance;
 * swap for a shared store (e.g. Upstash/Redis) when running multiple instances.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: Request): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return null;
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.reset - now) / 1000)) } },
    );
  }
  return null;
}
