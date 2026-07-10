"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, Banknote, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Staff actions on one founder's payout row: verify/reject their bank details,
 * and record a manual payout (amount + UTR reference) against the available
 * balance. The API re-checks the balance server-side; this is just the UI.
 */
export default function PayoutActions({
  userId, available, accountStatus, canManage,
}: {
  userId: string;
  available: number;
  accountStatus?: string;   // undefined when no details on file
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [amount, setAmount] = useState(String(available));
  const [reference, setReference] = useState("");

  if (!canManage) return null;

  async function call(path: string, body: Record<string, unknown>, label: string) {
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(label);
      setRecording(false);
      setReference("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {accountStatus === "submitted" && (
          <>
            <Btn
              onClick={() => call("/api/mission-control/payouts/verify-account", { user_id: userId, status: "verified" }, "Details verified")}
              busy={busy !== null} icon={ShieldCheck} label="Verify"
              cls="border-green-500/40 text-green-300 hover:bg-green-500/10"
            />
            <Btn
              onClick={() => call("/api/mission-control/payouts/verify-account", { user_id: userId, status: "rejected" }, "Details rejected")}
              busy={busy !== null} icon={ShieldX} label="Reject"
              cls="border-red-500/40 text-red-300 hover:bg-red-500/10"
            />
          </>
        )}
        {accountStatus === "verified" && available > 0 && !recording && (
          <Btn
            onClick={() => { setAmount(String(available)); setRecording(true); }}
            busy={false} icon={Banknote} label="Record payout"
            cls="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
          />
        )}
      </div>

      {recording && (
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="Amount ₹"
            className="w-24 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="UTR / bank reference"
            className="w-40 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={() => call("/api/mission-control/payouts/record", { user_id: userId, amount: Number(amount), reference }, "Payout recorded")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <Banknote size={11} />} Save
          </button>
          <button onClick={() => setRecording(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1">Cancel</button>
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, busy, icon: Icon, label, cls }: {
  onClick: () => void; busy: boolean; icon: React.ElementType; label: string; cls: string;
}) {
  return (
    <button onClick={onClick} disabled={busy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50 ${cls}`}>
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />} {label}
    </button>
  );
}
