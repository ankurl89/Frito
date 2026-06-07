import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { BrandDNA } from "@/lib/types";

export default async function BrandDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: brand }, { data: allBrands }] = await Promise.all([
    supabase.from("brands").select("*").eq("id", brandId).eq("user_id", user.id).single(),
    supabase.from("brands").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (!brand) redirect("/dashboard");

  return (
    <DashboardShell brand={brand as BrandDNA} allBrands={(allBrands || []) as BrandDNA[]}>
      {children}
    </DashboardShell>
  );
}
