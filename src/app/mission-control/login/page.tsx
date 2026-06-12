"use client";

/**
 * Staff login — the SEPARATE door to Mission Control.
 *
 * Distinct from the customer/founder login (/login). Uses the same Supabase
 * auth backend, but only accounts present in `staff_users` are allowed through;
 * anyone else is signed out with "no admin access". This is the access boundary
 * for the super-admin dashboard.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2, Lock } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedInNoAccess, setSignedInNoAccess] = useState(false);

  // On load: if already a staff member, go straight in. If signed in as a
  // non-staff account (e.g. a customer bounced here), say so clearly.
  useEffect(() => {
    fetch("/api/mission-control/session")
      .then(r => r.json())
      .then(s => {
        if (s.isStaff) { router.replace("/mission-control"); return; }
        if (s.authenticated) setSignedInNoAccess(true);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    // Authenticated — now verify staff membership.
    const s = await fetch("/api/mission-control/session").then(r => r.json()).catch(() => null);
    if (s?.isStaff) {
      router.replace("/mission-control");
      router.refresh();
    } else {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access. Contact a Frito admin if you need it.");
      setLoading(false);
    }
  }

  async function signOutNoAccess() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSignedInNoAccess(false);
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <p className="font-black text-lg tracking-tight">FRITO<span className="text-violet-500"> MC</span></p>
          <p className="font-mono text-[9px] tracking-widest text-zinc-600 mt-1">MISSION CONTROL · STAFF ACCESS</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-7">
          {checking ? (
            <div className="py-8 text-center"><Loader2 size={18} className="animate-spin mx-auto text-zinc-600" /></div>
          ) : signedInNoAccess ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
                <Lock size={16} className="text-amber-400" />
              </div>
              <p className="font-bold text-sm mb-1">No admin access</p>
              <p className="text-xs text-zinc-500 mb-5">You&apos;re signed in with an account that isn&apos;t a Frito staff member.</p>
              <button onClick={signOutNoAccess} className="w-full bg-zinc-800 text-zinc-200 font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm">
                Sign out & use a staff account
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-500 mb-2 uppercase">Staff email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@frito.com" required
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-500 mb-2 uppercase">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">{error}</div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : <>Enter Mission Control →</>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6 flex items-center justify-center gap-1.5">
          <Lock size={10} /> Restricted to Frito staff. Access is logged.
        </p>
      </div>
    </div>
  );
}
