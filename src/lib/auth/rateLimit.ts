//rate limiter that we'll swap for redis later
const buckets = new Map<string, { hits: number; reset: number }>();

export async function limit(key: string, windowMs = 10 * 60 * 1000, max = 5) {
  const now = Date.now();
  const b = buckets.get(key) ?? { hits: 0, reset: now + windowMs };
  if (now > b.reset) {
    b.hits = 0;
    b.reset = now + windowMs;
  }
  b.hits++;
  buckets.set(key, b);
  if (b.hits > max) {
    const err = new Error("rate_limited");
    // @ts-expect-error add meta
    err.status = 429;
    throw err;
  }
}
