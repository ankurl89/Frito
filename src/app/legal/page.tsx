import Link from "next/link";
import LegalShell, { LEGAL_LINKS, P } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Legal & Policies — Frito AI",
  description: "Terms, privacy, refunds, shipping, and contact information for Frito AI.",
};

const BLURBS: Record<string, string> = {
  "/terms": "The terms that govern your use of Frito.",
  "/privacy": "How we collect, use, and protect information.",
  "/refunds": "Cancellations, replacements, and refunds.",
  "/shipping": "Processing times, delivery, and tracking.",
  "/contact": "Reach our team and find our business details.",
};

export default function LegalIndexPage() {
  return (
    <LegalShell title="Legal & Policies">
      <P>Everything you need to know about how Frito operates. Choose a policy below.</P>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
        {LEGAL_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="block bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-400 hover:shadow-sm transition-all"
          >
            <p className="font-black text-zinc-900 mb-1">{l.label}</p>
            <p className="text-sm text-zinc-500">{BLURBS[l.href]}</p>
          </Link>
        ))}
      </div>
    </LegalShell>
  );
}
