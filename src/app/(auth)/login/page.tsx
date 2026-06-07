"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Nav */}
      <nav className="p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white border border-zinc-200 rounded-full px-6 py-3 shadow-sm">
          <Link href="/" className="font-black text-zinc-900 tracking-tight text-xl">
            FRITO<span className="text-violet-600">.</span>
          </Link>
          <Link href="/signup" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            No account? <span className="text-violet-600">Start free →</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="font-mono text-xs tracking-widest text-violet-600 mb-3">/ WELCOME BACK /</p>
            <h1 className="text-4xl font-black text-zinc-900 leading-tight">Sign in.</h1>
            <p className="text-zinc-500 mt-2">Your brand is waiting.</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2 uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2 uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-600 font-semibold hover:underline">
              Start free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
