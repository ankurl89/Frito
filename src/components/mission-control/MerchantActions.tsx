"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Suspend / un-suspend a merchant store. Suspending takes the entire
 * storefront offline (the store layout blocks suspended brands) without
 * deleting anything — fully reversible.
 */
export default function MerchantActions({
  brandId, status, canSuspend,
}: {
  brandId: string;
  status: string;
  canSuspend: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const suspended = status === "suspended";

  if (!canSuspend) return null;

  async function act(action: "suspend" | "unsuspend", confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/mission-control/merchants/${brandId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(action === "suspend" ? "Store suspended" : "Store reinstated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return suspended ? (
    <button
      onClick={() => act("unsuspend")}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/40 text-green-300 text-xs font-bold hover:bg-green-500/10 transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Reinstate store
    </button>
  ) : (
    <button
      onClick={() => act("suspend", "Suspend this store? Its storefront goes offline immediately for all customers. This is reversible.")}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} Suspend store
    </button>
  );
}
