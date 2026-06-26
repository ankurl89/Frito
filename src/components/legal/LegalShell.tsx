import Link from "next/link";

/**
 * Shared chrome for the policy / compliance pages (Terms, Privacy, Refunds,
 * Shipping, Contact). Light marketing-site theme. Cross-links every policy at
 * the bottom so reviewers (and customers) can reach all of them from any page.
 */

export const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund & Cancellation", href: "/refunds" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Contact Us", href: "/contact" },
];

export default function LegalShell({
  title, updated, children,
}: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Nav */}
      <nav className="p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between bg-white border border-zinc-200 rounded-full px-6 py-3 shadow-sm">
          <Link href="/" className="font-black text-zinc-900 tracking-tight text-xl">
            FRITO<span className="text-violet-600">.</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">{title}</h1>
        {updated && <p className="text-sm text-zinc-400 mb-10">Last updated: {updated}</p>}
        <div className="space-y-2">{children}</div>
      </main>

      {/* Cross-links */}
      <footer className="border-t border-zinc-200 mt-10">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LEGAL_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-6">© {new Date().getFullYear()} Frito AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Prose helpers (no typography plugin dependency) ── */

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-black text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-600 leading-relaxed">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 leading-relaxed">{children}</ul>;
}

/** Placeholder for business-specific details the owner must fill in. */
export function Fill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-yellow-100 text-yellow-900 px-1 rounded font-medium" title="Replace with your real business detail">
      {children}
    </span>
  );
}
