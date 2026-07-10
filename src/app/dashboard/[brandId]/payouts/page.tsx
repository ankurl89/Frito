"use client";

/**
 * Payouts — the founder's earnings ledger + payout setup.
 *
 * Earnings are shown at the ACCOUNT level (across all the founder's brands),
 * since payouts go to one bank account per founder. Numbers come from
 * /api/account/earnings (derived server-side); bank + PAN are saved via
 * /api/account/payout-details and always displayed masked.
 */

import { useCallback, useEffect, useState } from "react";
import { Landmark, Clock, Wallet, CheckCircle2, Loader2, Pencil, ShieldCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Earnings {
  earned: number; pending: number; cleared: number; paidOut: number; available: number;
  perBrand: { brandId: string; brandName: string; earned: number }[];
  payouts: { id: string; amount: number; status: string; reference: string | null; paid_at: string }[];
  refundBufferDays: number;
}
interface MaskedAccount {
  exists: boolean; status?: string; account_holder?: string;
  account_last4?: string; ifsc?: string; pan_masked?: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function PayoutsPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [account, setAccount] = useState<MaskedAccount | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const [e, a] = await Promise.all([
      fetch("/api/account/earnings").then(r => r.json()),
      fetch("/api/account/payout-details").then(r => r.json()),
    ]);
    setEarnings(e);
    setAccount(a);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!earnings || !account) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">/ PAYOUTS /</p>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Your earnings</h1>
        <p className="text-zinc-500 text-sm mt-1">Across all your brands · profit clears {earnings.refundBufferDays} days after each sale</p>
      </div>

      {/* Ledger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="TOTAL EARNED" value={inr(earnings.earned)} icon={Wallet} />
        <Stat label="PENDING CLEARANCE" value={inr(earnings.pending)} icon={Clock} sub={`clears after ${earnings.refundBufferDays} days`} />
        <Stat label="AVAILABLE" value={inr(earnings.available)} icon={CheckCircle2} highlight />
        <Stat label="PAID OUT" value={inr(earnings.paidOut)} icon={Landmark} />
      </div>

      {/* Payout details */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">PAYOUT DETAILS</p>
          {account.exists && !editing && <StatusBadge status={account.status || "submitted"} />}
        </div>

        {!account.exists || editing ? (
          <PayoutForm
            onSaved={() => { setEditing(false); load(); }}
            onCancel={account.exists ? () => setEditing(false) : undefined}
          />
        ) : (
          <div>
            <p className="text-sm text-zinc-500 mb-4">Your available balance is paid to this account on the regular payout cycle.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Detail label="Account holder" value={account.account_holder || "—"} />
              <Detail label="Account number" value={`•••• ${account.account_last4}`} />
              <Detail label="IFSC" value={account.ifsc || "—"} />
              <Detail label="PAN" value={account.pan_masked || "—"} />
            </div>
            {account.status === "submitted" && (
              <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-4">
                <ShieldCheck size={13} className="flex-shrink-0" /> We&rsquo;re verifying these details — payouts start once they&rsquo;re confirmed.
              </p>
            )}
            {account.status === "rejected" && (
              <p className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-4">
                <AlertCircle size={13} className="flex-shrink-0" /> We couldn&rsquo;t verify these details. Please check and re-submit them.
              </p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              <Pencil size={12} /> Update details
            </button>
          </div>
        )}
      </div>

      {/* Per-brand breakdown */}
      {earnings.perBrand.length > 1 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">EARNED BY BRAND</p>
          <div className="space-y-2">
            {earnings.perBrand.map(b => (
              <div key={b.brandId} className="flex justify-between text-sm">
                <span className="text-zinc-600">{b.brandName}</span>
                <span className="font-bold text-zinc-900">{inr(b.earned)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">PAYOUT HISTORY</p>
        {earnings.payouts.length === 0 ? (
          <p className="text-sm text-zinc-400">No payouts yet — they&rsquo;ll appear here once your available balance is paid out.</p>
        ) : (
          <div className="space-y-2">
            {earnings.payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm">
                <div>
                  <p className="font-bold text-zinc-900">{inr(Number(p.amount))}</p>
                  <p className="font-mono text-[10px] text-zinc-400">
                    {new Date(p.paid_at).toLocaleDateString("en-IN")}{p.reference ? ` · ref ${p.reference}` : ""}
                  </p>
                </div>
                <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${
                  p.status === "cancelled" ? "border-red-200 text-red-600 bg-red-50" : "border-green-200 text-green-700 bg-green-50"
                }`}>{p.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payout details form ─────────────────────────────────────── */

function PayoutForm({ onSaved, onCancel }: { onSaved: () => void; onCancel?: () => void }) {
  const [form, setForm] = useState({ account_holder: "", account_number: "", confirm_account: "", ifsc: "", pan: "" });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.account_number.replace(/\s+/g, "") !== form.confirm_account.replace(/\s+/g, "")) {
      toast.error("Account numbers don't match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/payout-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save details");
      toast.success("Payout details saved — we'll verify them shortly");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-3">
      <p className="text-sm text-zinc-500 mb-5">
        Add the bank account your earnings should be paid to. PAN is required for tax reporting on payouts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Account holder name" value={form.account_holder} onChange={v => setForm(f => ({ ...f, account_holder: v }))} placeholder="As per your bank account" />
        <Field label="IFSC code" value={form.ifsc} onChange={v => setForm(f => ({ ...f, ifsc: v.toUpperCase() }))} placeholder="HDFC0001234" mono />
        <Field label="Account number" value={form.account_number} onChange={v => setForm(f => ({ ...f, account_number: v }))} placeholder="Bank account number" mono inputMode="numeric" />
        <Field label="Re-enter account number" value={form.confirm_account} onChange={v => setForm(f => ({ ...f, confirm_account: v }))} placeholder="Type it again to confirm" mono inputMode="numeric" />
        <Field label="PAN" value={form.pan} onChange={v => setForm(f => ({ ...f, pan: v.toUpperCase() }))} placeholder="ABCDE1234F" mono />
      </div>
      <div className="flex items-center gap-3 mt-6">
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50">
          {saving && <Loader2 size={13} className="animate-spin" />} Save payout details
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
        )}
      </div>
    </form>
  );
}

/* ── Bits ────────────────────────────────────────────────────── */

function Stat({ label, value, icon: Icon, sub, highlight }: {
  label: string; value: string; icon: React.ElementType; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-zinc-900 border-zinc-900" : "bg-white border-zinc-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`font-mono text-[9px] tracking-widest ${highlight ? "text-zinc-500" : "text-zinc-400"}`}>{label}</p>
        <Icon size={14} className={highlight ? "text-yellow-300" : "text-zinc-300"} />
      </div>
      <p className={`text-2xl font-black ${highlight ? "text-yellow-300" : "text-zinc-900"}`}>{value}</p>
      {sub && <p className={`text-[10px] font-mono mt-1 ${highlight ? "text-zinc-500" : "text-zinc-400"}`}>{sub}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
      <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-0.5">{label.toUpperCase()}</p>
      <p className="font-bold text-zinc-900 text-sm">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    verified: "border-green-200 text-green-700 bg-green-50",
    submitted: "border-amber-200 text-amber-700 bg-amber-50",
    rejected: "border-red-200 text-red-600 bg-red-50",
  };
  const label: Record<string, string> = { verified: "VERIFIED", submitted: "VERIFYING", rejected: "ACTION NEEDED" };
  return (
    <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${cls[status] || cls.submitted}`}>
      {label[status] || status.toUpperCase()}
    </span>
  );
}

interface FieldProps {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; inputMode?: "text" | "numeric";
}
function Field({ label, value, onChange, placeholder, mono, inputMode }: FieldProps) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-1.5 uppercase">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required
        className={`w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
