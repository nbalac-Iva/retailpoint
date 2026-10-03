"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";

export async function createCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const pib = String(formData.get("pib") ?? "").trim();
  if (!name) return { error: "Unesite naziv firme." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_company", { p_name: name, p_pib: pib });
  if (error) return { error: error.message };
  redirect("/");
}
