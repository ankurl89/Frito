import { createServiceClient } from "@/lib/supabase/service";
import { listProviders, getProvider } from "@/lib/fulfillment/registry";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import DeadLetterActions from "@/components/mission-control/DeadLetterActions";
import { Truck, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FulfillmentOpsPage() {
  const staff = await getStaff();
  const svc = createServiceClient();

  const [{ data: fulfillments }, { data: jobs }] = await Promise.all([
    svc.from("fulfillment_orders").select("provider, status, sandbox, created_at"),
    svc.from("job_queue").select("id, type, status, attempts, last_error, payload, created_at"),
  ]);

  const fos = (fulfillments || []) as { provider: string; status: string; sandbox: boolean }[];
  const allJobs = (jobs || []) as JobRow[];
  const deadJobs = allJobs.filter(j => j.status === "dead");

  // Per-provider rollup.
  const providers = listProviders().map(name => {
    const rows = fos.filter(f => f.provider === name);
    const caps = getProvider(name).getCapabilities();
    const submitJobs = allJobs.filter(j => j.type === "fulfillment.submit");
    const failed = submitJobs.filter(j => j.status === "dead" || j.status === "failed").length;
    const succeeded = submitJobs.filter(j => j.status === "succeeded").length;
    const successRate = succeeded + failed > 0 ? Math.round((succeeded / (succeeded + failed)) * 100) : 100;
    return { name, total: rows.length, sandbox: caps.sandbox, successRate, caps };
  });

  const queueStats = {
    queued: allJobs.filter(j => j.status === "queued").length,
    processing: allJobs.filter(j => j.status === "processing").length,
    failed: allJobs.filter(j => j.status === "failed").length,
    dead: deadJobs.length,
    succeeded: allJobs.filter(j => j.status === "succeeded").length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ FULFILLMENT OPERATIONS /</p>
        <h1 className="text-3xl font-black tracking-tight">Provider Health</h1>
        <p className="text-zinc-500 text-sm mt-1">Adapter status, queue throughput, dead-letter queue</p>
      </div>

      {/* Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {providers.map(p => (
          <div key={p.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Truck size={16} className="text-zinc-400" />
                </div>
                <div>
                  <p className="font-black capitalize">{p.name}</p>
                  <p className="font-mono text-[9px] tracking-wider text-zinc-600">
                    {p.sandbox ? "SANDBOX MODE" : "LIVE"}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wider px-2 py-1 rounded border ${
                p.sandbox ? "border-amber-500/40 text-amber-300 bg-amber-500/10" : "border-green-500/40 text-green-300 bg-green-500/10"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.sandbox ? "bg-amber-400" : "bg-green-400"} animate-pulse`} />
                {p.sandbox ? "SIMULATED" : "HEALTHY"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="ORDERS" value={p.total} />
              <Stat label="SUCCESS" value={`${p.successRate}%`} accent={p.successRate >= 99 ? "text-green-400" : "text-amber-400"} />
              <Stat label="CANCEL" value={p.caps.supportsCancel ? "YES" : "NO"} />
            </div>
          </div>
        ))}
      </div>

      {/* Queue throughput */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-4">QUEUE THROUGHPUT</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="SUCCEEDED" value={queueStats.succeeded} accent="text-green-400" />
          <Stat label="QUEUED" value={queueStats.queued} />
          <Stat label="PROCESSING" value={queueStats.processing} accent="text-blue-400" />
          <Stat label="RETRYING" value={queueStats.failed} accent={queueStats.failed > 0 ? "text-amber-400" : undefined} />
          <Stat label="DEAD" value={queueStats.dead} accent={queueStats.dead > 0 ? "text-red-400" : "text-green-400"} />
        </div>
      </div>

      {/* Dead-letter queue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          {deadJobs.length > 0 ? <AlertTriangle size={14} className="text-red-400" /> : <CheckCircle2 size={14} className="text-green-400" />}
          <p className="font-mono text-[10px] tracking-widest text-zinc-600">DEAD-LETTER QUEUE</p>
        </div>
        {deadJobs.length === 0 ? (
          <p className="text-zinc-600 font-mono text-xs">Empty — no jobs have exhausted retries.</p>
        ) : (
          <div className="space-y-2">
            {deadJobs.map(j => (
              <div key={j.id} className="flex items-center justify-between bg-zinc-950 border border-red-500/20 rounded-lg px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-zinc-300">{j.type} · order {String(j.payload?.orderId || "").slice(0, 8)}</p>
                  <p className="font-mono text-[10px] text-red-400/70 truncate mt-0.5">{j.last_error}</p>
                </div>
                {staff && hasPermission(staff.role, "retry_job") && (
                  <DeadLetterActions jobId={j.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
      <p className={`text-xl font-black ${accent || ""}`}>{value}</p>
      <p className="font-mono text-[9px] tracking-wider text-zinc-600 mt-0.5">{label}</p>
    </div>
  );
}

interface JobRow { id: string; type: string; status: string; attempts: number; last_error: string | null; payload: Record<string, unknown>; }
