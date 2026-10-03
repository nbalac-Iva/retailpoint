"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { getContext, NO_EDIT } from "@/lib/context";

function employeeFields(formData: FormData) {
  return {
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    job_position_id: String(formData.get("job_position_id") ?? "") || null,
    employed_from: String(formData.get("employed_from") ?? "") || null,
    status: String(formData.get("status") ?? "active"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const fields = employeeFields(formData);
  if (!fields.first_name || !fields.last_name) return { error: "Unesite ime i prezime." };

  const { data, error } = await supabase
    .from("employee")
    .insert({ ...fields, company_id: companyId })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect(`/zaposleni/${data.id}`);
}

export async function updateEmployee(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const fields = employeeFields(formData);
  if (!fields.first_name || !fields.last_name) return { error: "Unesite ime i prezime." };

  const { error } = await supabase.from("employee").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteEmployee(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("employee").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/zaposleni");
}
