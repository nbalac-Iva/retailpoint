import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "bzr" | "pregled";

// Prijavljeni korisnik i njegova firma; cache() ga deli unutar jednog zahteva.
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: memberships } = await supabase
    .from("membership")
    .select("company_id, role, company:company_id (id, name, pib)")
    .order("created_at")
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) redirect("/pocetak");

  const company = membership.company as unknown as { id: string; name: string; pib: string | null };
  const role = membership.role as Role;

  return {
    supabase,
    email: (data.claims.email as string | undefined) ?? "",
    company,
    companyId: company.id,
    role,
    canEdit: role === "admin" || role === "bzr",
  };
});

export const NO_EDIT = { error: "Nemate pravo izmene." };
