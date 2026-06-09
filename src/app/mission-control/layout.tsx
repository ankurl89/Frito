/**
 * Mission Control shell — isolated internal operations cockpit.
 *
 * Hard-gated: only staff_users may enter. Merchants hitting /mission-control
 * are bounced to their dashboard. Completely separate nav/identity from the
 * merchant app — no shared shell, no shared session semantics.
 */

import { redirect } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import MissionControlNav from "@/components/mission-control/MissionControlNav";

export const metadata = { title: "Frito Mission Control" };

export default async function MissionControlLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff) redirect("/dashboard"); // not staff → back to merchant app

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <MissionControlNav staff={staff} />
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
