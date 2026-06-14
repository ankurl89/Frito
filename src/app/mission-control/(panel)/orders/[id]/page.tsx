import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import { ORDER_STATUS_META } from "@/lib/orders/states";
import { providerLabel } from "@/lib/fulfillment/registry";
import { ArrowLeft } from "lucide-react";
import OrderActions from "@/components/mission-control/OrderActions";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaff();
  if (!staff) notFound();

  const svc = createServiceClient();
  const [{ data: order }, { data: events }, { data: fulfillment }, { data: jobs }] = await Promise.all([
    svc.from("orders").select("*, brands(name, slug, user_id), products(name, fulfillment_provider, sku)").eq("id", id).single(),
    svc.from("order_events").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    svc.from("fulfillment_orders").select("*").eq("order_id", id).maybeSingle(),
    svc.from("job_queue").select("*").eq("payload->>orderId", id).order("created_at", { ascending: false }),
  ]);

  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status] || { label: order.status, cls: "" };
  const addr = order.shipping_address as Record<string, string>;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/mission-control/orders" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6">
        <ArrowLeft size={14} /> Back to orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight font-mono">#{order.id.slice(0, 8).toUpperCase()}</h1>
            <span className={`font-mono text-[10px] tracking-wider border rounded px-2 py-0.5 ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="text-zinc-500 text-sm">
            {order.brands?.name} · {order.products?.name} · ₹{order.total_amount?.toLocaleString("en-IN")}
          </p>
        </div>

        <OrderActions
          orderId={order.id}
          status={order.status}
          permissions={{
            retry: hasPermission(staff.role, "retry_order"),
            cancel: hasPermission(staff.role, "cancel_order"),
            refund: hasPermission(staff.role, "refund_order"),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <Panel title="ORDER TIMELINE">
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />
              <div className="space-y-4">
                {(events || []).map((e: AuditEvent) => (
                  <div key={e.id} className="flex gap-4 relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-zinc-900 z-10 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold">{e.to_state}</span>
                        {e.from_state && <span className="font-mono text-[10px] text-zinc-600">from {e.from_state}</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{e.event} · {e.actor}</p>
                      <p className="font-mono text-[10px] text-zinc-600 mt-0.5">{new Date(e.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Provider payload */}
          {fulfillment && (
            <Panel title={`PROVIDER PAYLOAD · ${providerLabel(fulfillment.provider).toUpperCase()}${fulfillment.sandbox ? " · SANDBOX" : ""}`}>
              <div className="space-y-2 text-xs mb-3">
                <Row k="Provider Order ID" v={fulfillment.provider_order_id || "—"} mono />
                <Row k="Status" v={fulfillment.status} />
                <Row k="Tracking" v={fulfillment.tracking_number ? `${fulfillment.tracking_number} (${fulfillment.courier})` : "—"} />
              </div>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-400 overflow-x-auto max-h-48">
                {JSON.stringify(fulfillment.response_payload, null, 2)}
              </pre>
            </Panel>
          )}

          {/* Jobs */}
          <Panel title="FULFILLMENT JOBS">
            {(jobs || []).length === 0 ? (
              <p className="text-zinc-600 font-mono text-xs">No jobs</p>
            ) : (
              <div className="space-y-2">
                {(jobs as JobRow[]).map(j => (
                  <div key={j.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs">
                    <span className="font-mono text-zinc-400">{j.type}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600">×{j.attempts}</span>
                      <JobBadge status={j.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Side: customer + shipping */}
        <div className="space-y-5">
          <Panel title="CUSTOMER">
            <div className="space-y-2 text-xs">
              <Row k="Name" v={order.customer_name} />
              <Row k="Email" v={order.customer_email} />
              <Row k="Phone" v={order.customer_phone || "—"} />
            </div>
          </Panel>
          <Panel title="SHIPPING">
            <div className="text-xs text-zinc-400 space-y-0.5">
              <p>{addr?.line1}</p>
              {addr?.line2 && <p>{addr.line2}</p>}
              <p>{addr?.city}, {addr?.state} {addr?.pincode}</p>
              <p>{addr?.country}</p>
            </div>
          </Panel>
          <Panel title="FINANCIALS">
            <div className="space-y-2 text-xs">
              <Row k="Revenue" v={`₹${order.total_amount?.toLocaleString("en-IN")}`} />
              <Row k="Cost" v={`₹${order.cost_amount?.toLocaleString("en-IN")}`} />
              <Row k="Profit" v={`₹${order.profit_amount?.toLocaleString("en-IN")}`} accent="text-green-400" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-4">{title}</p>
      {children}
    </div>
  );
}
function Row({ k, v, mono, accent }: { k: string; v: string; mono?: boolean; accent?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-600">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${accent || "text-zinc-300"} text-right truncate`}>{v}</span>
    </div>
  );
}
function JobBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    succeeded: "text-green-400", queued: "text-zinc-400", processing: "text-blue-400",
    failed: "text-amber-400", dead: "text-red-400",
  };
  return <span className={`font-mono text-[9px] tracking-wider ${cls[status] || "text-zinc-400"}`}>{status.toUpperCase()}</span>;
}

interface AuditEvent { id: string; from_state: string | null; to_state: string; event: string; actor: string; created_at: string; }
interface JobRow { id: string; type: string; status: string; attempts: number; }
