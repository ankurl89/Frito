"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeadLetterActions({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/mission-control/jobs/${jobId}/revive`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Job revived");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={revive} disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs font-bold transition-colors disabled:opacity-50 flex-shrink-0">
      {busy ? <Loader2 size={11} className="animate-spin" /> : <RotateCw size={11} />} Revive
    </button>
  );
}
