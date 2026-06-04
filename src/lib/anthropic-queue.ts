/**
 * Module-level semaphore for Anthropic API calls.
 *
 * Why module-level: each pm2 worker is a single Node.js process. A module-level
 * semaphore limits concurrency within that process. With `pm2 -i max` on a 2-core
 * VPS we get 2 workers × CONCURRENCY_PER_WORKER = total in-flight Anthropic calls.
 *
 * Anthropic Tier 1 allows ~50 RPM for Haiku. At ~6s per response that is roughly
 * 8 concurrent calls across the whole app. We conservatively use 4 per worker
 * (= 8 total on a 2-core VPS) and queue up to 20 waiting requests; beyond that
 * we reject with 503 so the client can show a graceful "try again" message.
 */

const CONCURRENCY = parseInt(process.env.ANTHROPIC_QUEUE_CONCURRENCY ?? "4", 10);
const MAX_QUEUE   = parseInt(process.env.ANTHROPIC_QUEUE_MAX ?? "20", 10);
const QUEUE_TIMEOUT_MS = 25_000; // give up waiting in queue after 25s

let active = 0;
const queue: Array<() => void> = [];

function next() {
  if (active >= CONCURRENCY || queue.length === 0) return;
  const resolve = queue.shift()!;
  active++;
  resolve();
}

/**
 * Acquire a concurrency slot and return an idempotent release() function.
 * Streaming-friendly: hold the slot for the lifetime of the stream and call
 * release() as soon as generation finishes (or on error).
 * Throws QUEUE_FULL / QUEUE_TIMEOUT like withAnthropicQueue.
 */
export async function acquireAnthropicSlot(): Promise<() => void> {
  if (active < CONCURRENCY) {
    active++;
  } else {
    if (queue.length >= MAX_QUEUE) {
      const err = new Error("Queue full — service temporarily overloaded");
      (err as NodeJS.ErrnoException).code = "QUEUE_FULL";
      throw err;
    }
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const idx = queue.indexOf(wrappedResolve);
        if (idx !== -1) queue.splice(idx, 1);
        const err = new Error("Queue timeout — service temporarily overloaded");
        (err as NodeJS.ErrnoException).code = "QUEUE_TIMEOUT";
        reject(err);
      }, QUEUE_TIMEOUT_MS);

      const wrappedResolve = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };

      queue.push(wrappedResolve);
    });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    active--;
    next();
  };
}

/**
 * Run `fn` under the Anthropic concurrency semaphore.
 * Throws QUEUE_FULL if the queue is full, or QUEUE_TIMEOUT on queue timeout.
 */
export async function withAnthropicQueue<T>(fn: () => Promise<T>): Promise<T> {
  const release = await acquireAnthropicSlot();
  try {
    return await fn();
  } finally {
    release();
  }
}
