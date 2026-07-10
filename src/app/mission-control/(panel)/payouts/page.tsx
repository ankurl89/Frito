import { notFound } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import { listPayoutOverview, REFUND_BUFFER_DAYS } from "@/lib/payouts";
import PayoutActions from "@/components/mission-control/PayoutActions";
import { Landmark } from "lucide-react";

export const dynamic = "force-dynamic";

const ACCOUNT_META: Record<string, { label: string; cls: string }> = {
  verified:  { label: "VERIFIED",   cls: "border-green-500/40 text-green-300 bg-green-500/10" },
  submitted: { label: "TO VERIFY",  cls: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
  rejected:  { label: "REJECTED",   cls: "border-red-500/40 text-red-300 bg-red-500/10" },
  none:      { label: "NO DETAILS", cls: "border-zinc-600 text-zinc-500 bg-zinc-800/40" },
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function PayoutsDeskPage() {
  const staff = await getStaff();
  if (!staff || !hasPermission(staff.role, "view_payouts")) notFound();
  const canManage = hasPermission(staff.role, "manage_payouts");

  const rows = await listPayoutOverview();
  const totalOwed = rows.reduce((s, r) => s + r.available, 0);
  const toVerify = rows.filter(r => r.account.status === "submitted").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ PAYOUTS DESK /</p>
        <h1 className="text-3xl font-black tracking-tight">Founder Payouts</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {inr(totalOwed)} available across {rows.length} founders · {toVerify} awaiting verification · {REFUND_BUFFER_DAYS}-day clearance buffer
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[860px]">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-zinc-800 font-mono text-[9px] tracking-widest text-zinc-600">
          <div className="col-span-3">FOUNDER</div>
          <div className="col-span-2">BANK DETAILS</div>
          <div className="col-span-1 text-right">EARNED</div>
          <div className="col-span-1 text-right">PENDING</div>
          <div className="col-span-1 text-right">AVAILABLE</div>
          <div className="col-span-1 text-right">PAID</div>
          <div className="col-span-3 text-right">ACTIONS</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-zinc-600 font-mono text-xs">
            NO EARNINGS OR PAYOUT DETAILS YET
          </div>
        ) : rows.map(r => {
          const meta = ACCOUNT_META[r.account.status || "none"] || ACCOUNT_META.none;
          return (
            <div key={r.userId} className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-zinc-800/50 last:border-0 items-center text-sm">
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Landmark size={13} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{r.email || r.userId.slice(0, 8)}</p>
                    <p className="font-mono text-[10px] text-zinc-600 truncate">{r.brandNames.join(", ") || "no brands"}</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 min-w-0">
                <span className={`font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.label}</span>
                {r.account.exists && (
                  <p className="font-mono text-[10px] text-zinc-600 mt-1 truncate">
                    •••{r.account.account_last4} · {r.account.ifsc}
                  </p>
                )}
              </div>
              <div className="col-span-1 text-right text-zinc-300">{inr(r.earned)}</div>
              <div className="col-span-1 text-right text-zinc-500">{inr(r.pending)}</div>
              <div className={`col-span-1 text-right font-bold ${r.available > 0 ? "text-green-400" : "text-zinc-500"}`}>{inr(r.available)}</div>
              <div className="col-span-1 text-right text-zinc-400">{inr(r.paidOut)}</div>
              <div className="col-span-3 flex justify-end">
                <PayoutActions
                  userId={r.userId}
                  available={r.available}
                  accountStatus={r.account.status}
                  canManage={canManage}
                />
              </div>
            </div>
          );
        })}
        </div>
        </div>
      </div>

      <p className="text-zinc-600 text-xs mt-4 max-w-2xl">
        Phase 1: transfers are made manually from the company bank account, then recorded here with the
        UTR reference. Recording is only possible against verified details and never above the founder&rsquo;s
        available balance. Every action is audit-logged.
      </p>
    </div>
  );
}
