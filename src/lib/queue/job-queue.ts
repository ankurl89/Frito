/**
 * Durable job queue — Postgres outbox pattern.
 *
 * Why not SQS/Inngest/Kafka? "No vendor lock-in" is a stated principle, and a
 * Postgres-backed queue with `FOR UPDATE SKIP LOCKED` gives us durable delivery,
 * concurrency-safe claiming, exponential backoff, and a dead-letter state with
 * ZERO new infrastructure. The `JobQueue` surface here is deliberately small so
 * it can be swapped for QStash/Inngest behind the same interface if volume ever
 * demands it — without touching the Fulfillment Engine or adapters.
 *
 * Driving the worker:
 *   - dev/prod: `kickWorker()` fires an immediate (non-blocking) processing pass
 *   - prod safety net: pg_cron + pg_net pings /api/jobs/worker every minute to
 *     drain retries and anything the inline kick missed (see MIGRATIONS.md)
 */

import { createServiceClient } from "@/lib/supabase/service";

export type JobType =
  | "fulfillment.submit"          // submit an order to its provider
  | "fulfillment.sync_tracking"   // poll tracking for a provider order
  | "order.simulate_advance";     // sandbox: advance order one stage

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

// Retry backoff (seconds): 1m → 5m → 15m → 1h → 24h, then dead-letter.
const BACKOFF_SECONDS = [60, 300, 900, 3600, 86400];

interface EnqueueOptions {
  type: JobType;
  payload: Record<string, unknown>;
  /** Dedupe key — a second enqueue with the same key is ignored. */
  idempotencyKey?: string;
  maxAttempts?: number;
  /** Delay before first attempt (seconds). */
  delaySeconds?: number;
}

export async function enqueue(opts: EnqueueOptions): Promise<string | null> {
  const supabase = createServiceClient();
  const nextAttempt = new Date(Date.now() + (opts.delaySeconds ?? 0) * 1000).toISOString();

  const { data, error } = await supabase
    .from("job_queue")
    .insert({
      type: opts.type,
      payload: opts.payload,
      idempotency_key: opts.idempotencyKey ?? null,
      max_attempts: opts.maxAttempts ?? 6,
      next_attempt_at: nextAttempt,
      status: "queued",
    })
    .select("id")
    .single();

  if (error) {
    // Unique violation on idempotency_key = already enqueued. That's success.
    if (error.code === "23505") return null;
    console.error("[queue] enqueue failed:", error.message);
    throw new Error(error.message);
  }
  return data.id;
}

/** Claim one ready job atomically (FOR UPDATE SKIP LOCKED via claim_job RPC). */
export async function claimNext(workerId: string): Promise<Job | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("claim_job", { p_worker: workerId });
  if (error) {
    console.error("[queue] claim failed:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    attempts: row.attempts,
    max_attempts: row.max_attempts,
  };
}

export async function markSucceeded(jobId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("job_queue")
    .update({ status: "succeeded", locked_at: null, locked_by: null, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

/**
 * Mark a job failed. Reschedules with backoff, or dead-letters once attempts
 * exhaust max_attempts.
 */
export async function markFailed(job: Job, errorMessage: string): Promise<"retry" | "dead"> {
  const supabase = createServiceClient();
  const dead = job.attempts >= job.max_attempts;

  if (dead) {
    await supabase
      .from("job_queue")
      .update({ status: "dead", last_error: errorMessage, locked_at: null, locked_by: null, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    // Escalation hook: a "dead" job is the signal to alert ops / page on-call.
    console.error(`[queue] DEAD-LETTER job ${job.id} (${job.type}) after ${job.attempts} attempts: ${errorMessage}`);
    return "dead";
  }

  const delay = BACKOFF_SECONDS[Math.min(job.attempts - 1, BACKOFF_SECONDS.length - 1)];
  const nextAttempt = new Date(Date.now() + delay * 1000).toISOString();
  await supabase
    .from("job_queue")
    .update({
      status: "failed",
      last_error: errorMessage,
      next_attempt_at: nextAttempt,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
  return "retry";
}

/**
 * Fire-and-forget: nudge the worker to process now. Non-blocking so it never
 * adds latency to checkout. pg_cron is the durable fallback.
 */
export function kickWorker(): void {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/jobs/worker`;
  fetch(url, {
    method: "POST",
    headers: { "x-worker-secret": process.env.WORKER_SECRET || "" },
  }).catch(() => { /* best-effort; cron will catch stragglers */ });
}
