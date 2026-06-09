"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      // Award account-created XP on the server.
      fetch("/api/founder/award-signup", { method: "POST" }).catch(() => {});
      toast.success("Account created! Let's build your brand.");
      router.push("/onboarding");
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
          <Link href="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            Already started? <span className="text-violet-600">Sign in →</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-1.5 text-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              4,219 brands launched this month
            </div>
          </div>

          <div className="mb-8 text-center">
            <p className="font-mono text-xs tracking-widest text-violet-600 mb-3">/ GET STARTED /</p>
            <h1 className="text-4xl font-black text-zinc-900 leading-tight">
              Build your brand.<br />
              <span className="text-zinc-400">Start free.</span>
            </h1>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2 uppercase">Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
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
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Create free account →"}
              </button>
            </form>
            <p className="text-[11px] text-zinc-400 text-center mt-4">
              No credit card · No inventory · Cancel anytime
            </p>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
