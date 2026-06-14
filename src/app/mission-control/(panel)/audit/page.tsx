import { notFound } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission, ROLE_META, StaffRole } from "@/lib/mission-control/rbac";
import { listAuditLog } from "@/lib/mission-control/admin-data";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

/** Human-friendly colour per action family. */
function actionCls(action: string): string {
  if (action.includes("suspend")) return "text-red-300";
  if (action.includes("refund") || action.includes("cancel")) return "text-amber-300";
  if (action.includes("retry") || action.includes("revive")) return "text-blue-300";
  return "text-zinc-300";
}

export default async function AuditPage() {
  const staff = await getStaff();
  if (!staff || !hasPermission(staff.role, "view_audit")) notFound();

  const rows = await listAuditLog(200);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ AUDIT LOG /</p>
        <h1 className="text-3xl font-black tracking-tight">Audit Trail</h1>
        <p className="text-zinc-500 text-sm mt-1">Immutable record of every privileged action · last {rows.length}</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-16 text-center">
          <ScrollText size={20} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600 font-mono text-xs">No privileged actions recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => {
            const roleMeta = ROLE_META[r.actorRole as StaffRole];
            const hasDiff = r.before != null || r.after != null;
            return (
              <details key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                <summary className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm cursor-pointer hover:bg-zinc-800/40 transition-colors list-none">
                  <span className="col-span-3 font-mono text-xs">
                    <span className={`font-bold ${actionCls(r.action)}`}>{r.action}</span>
                  </span>
                  <span className="col-span-2 truncate text-zinc-400 text-xs">{r.entityType}</span>
                  <span className="col-span-2 font-mono text-[10px] text-zinc-600 truncate">{r.entityId.slice(0, 12)}</span>
                  <span className="col-span-3 truncate text-zinc-400 text-xs flex items-center gap-2">
                    {r.actorEmail || "—"}
                    {roleMeta && <span className={`font-mono text-[8px] tracking-wider border rounded px-1 py-0.5 ${roleMeta.cls}`}>{roleMeta.label.toUpperCase()}</span>}
                  </span>
                  <span className="col-span-2 text-right font-mono text-[10px] text-zinc-600">{new Date(r.createdAt).toLocaleString("en-IN")}</span>
                </summary>
                {hasDiff && (
                  <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-zinc-600 mb-1">BEFORE</p>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 overflow-x-auto">{JSON.stringify(r.before, null, 2) || "—"}</pre>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-wider text-zinc-600 mb-1">AFTER</p>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 overflow-x-auto">{JSON.stringify(r.after, null, 2) || "—"}</pre>
                    </div>
                    {r.ip && <p className="md:col-span-2 font-mono text-[10px] text-zinc-600">IP · {r.ip}</p>}
                  </div>
                )}
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
