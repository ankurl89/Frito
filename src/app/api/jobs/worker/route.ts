import { NextRequest, NextResponse } from "next/server";
import { claimNext, markSucceeded, markFailed, Job } from "@/lib/queue/job-queue";
import { submitOrder, simulateAdvance, syncTracking } from "@/lib/fulfillment/engine";
import { randomUUID } from "crypto";

/**
 * Job worker — drains the durable queue.
 *
 * Auth: x-worker-secret header (shared secret). Never exposed to the browser.
 *
 * Invoked by:
 *   - kickWorker() inline after enqueue (immediate processing)
 *   - pg_cron + pg_net every minute (durable retry drain — see MIGRATIONS.md)
 *
 * Processes up to MAX_JOBS per invocation so a single call can't run unbounded
 * on serverless. Concurrency-safe via FOR UPDATE SKIP LOCKED in claim_job.
 */
const MAX_JOBS = 10;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-worker-secret");
  if (!process.env.WORKER_SECRET || secret !== process.env.WORKER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = `w_${randomUUID().slice(0, 8)}`;
  const results: { id: string; type: string; outcome: string }[] = [];

  for (let i = 0; i < MAX_JOBS; i++) {
    const job = await claimNext(workerId);
    if (!job) break; // queue drained

    try {
      await dispatch(job);
      await markSucceeded(job.id);
      results.push({ id: job.id, type: job.type, outcome: "succeeded" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const outcome = await markFailed(job, msg);
      results.push({ id: job.id, type: job.type, outcome });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

async function dispatch(job: Job): Promise<void> {
  const orderId = job.payload.orderId as string;
  switch (job.type) {
    case "fulfillment.submit":
      return submitOrder(orderId);
    case "order.simulate_advance":
      return simulateAdvance(orderId);
    case "fulfillment.sync_tracking":
      return syncTracking(orderId);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

// Allow GET for health checks / manual triggering during dev.
export async function GET(req: NextRequest) {
  return POST(req);
}
