import { NextResponse } from "next/server";
import { kickWorker } from "@/lib/queue/job-queue";

/**
 * Dev-only worker tick.
 *
 * In production, pg_cron + pg_net drain the queue every minute (see
 * docs/FULFILLMENT.md). Supabase cloud can't reach a localhost dev server,
 * so this endpoint lets a dev-only client ticker nudge the worker locally.
 *
 * Hard-gated to non-production so it can never be used to spam the worker
 * in a deployed environment.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  kickWorker();
  return NextResponse.json({ ticked: true });
}
