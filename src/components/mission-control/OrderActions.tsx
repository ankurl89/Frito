"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, XCircle, Receipt, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OrderActions({
  orderId, status, permissions,
}: {
  orderId: string;
  status: string;
  permissions: { retry: boolean; cancel: boolean; refund: boolean };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const canRetry = permissions.retry && ["failed", "fulfillment_pending"].includes(status);
  const canCancel = permissions.cancel && !["delivered", "cancelled", "refunded"].includes(status);
  const canRefund = permissions.refund && ["paid", "delivered", "shipped"].includes(status);

  async function act(action: string, label: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/mission-control/orders/${orderId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(`${label} done`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!canRetry && !canCancel && !canRefund) {
    return <p className="font-mono text-[10px] text-zinc-600">NO ACTIONS AVAILABLE</p>;
  }

  return (
    <div className="flex items-center gap-2">
      {canRetry && (
        <ActionBtn onClick={() => act("retry", "Retry")} busy={busy === "retry"} icon={RotateCw} label="Retry" cls="border-blue-500/40 text-blue-300 hover:bg-blue-500/10" />
      )}
      {canRefund && (
        <ActionBtn onClick={() => act("refund", "Refund", "Issue a refund for this order? This marks it refunded.")} busy={busy === "refund"} icon={Receipt} label="Refund" cls="border-amber-500/40 text-amber-300 hover:bg-amber-500/10" />
      )}
      {canCancel && (
        <ActionBtn onClick={() => act("cancel", "Cancel", "Cancel this order? If submitted to a provider, a cancel request is sent.")} busy={busy === "cancel"} icon={XCircle} label="Cancel" cls="border-red-500/40 text-red-300 hover:bg-red-500/10" />
      )}
    </div>
  );
}

function ActionBtn({ onClick, busy, icon: Icon, label, cls }: {
  onClick: () => void; busy: boolean; icon: React.ElementType; label: string; cls: string;
}) {
  return (
    <button onClick={onClick} disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50 ${cls}`}>
      {busy ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />} {label}
    </button>
  );
}
