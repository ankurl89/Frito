import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";
import { kickWorker } from "@/lib/queue/job-queue";

/** Revive a dead-lettered job — reset attempts and requeue for immediate retry. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("retry_job");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const svc = createServiceClient();
  const { data: job } = await svc.from("job_queue").select("status, type").eq("id", id).single();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  await svc.from("job_queue").update({
    status: "queued",
    attempts: 0,
    next_attempt_at: new Date().toISOString(),
    last_error: null,
    locked_at: null,
    locked_by: null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  kickWorker();

  await logAdminAction({
    staff: auth.staff, action: "job.revive", entityType: "job", entityId: id,
    before: { status: job.status }, after: { status: "queued" },
    metadata: { type: job.type }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
