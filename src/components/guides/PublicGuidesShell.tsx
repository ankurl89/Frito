import Link from "next/link";

/**
 * Light marketing chrome for the PUBLIC (logged-out) guides. Same Founder
 * Playbook content as the dashboard, but reachable before signup to reduce
 * pre-signup hesitation — every page funnels to "Start free".
 */
export default function PublicGuidesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <nav className="p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between bg-white border border-zinc-200 rounded-full px-6 py-3 shadow-sm">
          <Link href="/" className="font-black text-zinc-900 tracking-tight text-xl">
            FRITO<span className="text-violet-600">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/guides" className="hidden sm:inline text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
              Guides
            </Link>
            <Link href="/signup" className="bg-violet-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-violet-700 transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 mt-10">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-400">
          <p>© {new Date().getFullYear()} Frito AI</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <Link href="/legal" className="hover:text-zinc-900 transition-colors">Legal</Link>
            <Link href="/signup" className="hover:text-zinc-900 transition-colors">Start free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
