"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/action-form";
import { getContext, NO_EDIT } from "@/lib/context";
import { addMonths } from "@/lib/format";

export async function createProgram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Unesite naziv obuke." };
  const months = parseInt(String(formData.get("validity_months") ?? ""), 10);

  const { error } = await supabase.from("training_program").insert({
    company_id: companyId,
    name,
    is_statutory: formData.get("is_statutory") === "on",
    validity_months: Number.isFinite(months) && months > 0 ? months : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteProgram(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("training_program").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function addTrainingRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;

  const employeeId = String(formData.get("employee_id") ?? "");
  const programId = String(formData.get("training_program_id") ?? "");
  const heldOn = String(formData.get("held_on") ?? "");
  if (!employeeId || !programId || !heldOn) return { error: "Popunite zaposlenog, obuku i datum." };
  const passed = formData.get("passed") === "on";

  // Rok važenja = datum obuke + važenje programa (ako ga program ima).
  const { data: program } = await supabase
    .from("training_program")
    .select("validity_months")
    .eq("id", programId)
    .single();
  const validUntil = passed && program?.validity_months ? addMonths(heldOn, program.validity_months) : null;

  const { error } = await supabase.from("training_record").insert({
    company_id: companyId,
    employee_id: employeeId,
    training_program_id: programId,
    held_on: heldOn,
    reason: String(formData.get("reason") ?? "") || null,
    trainer: String(formData.get("trainer") ?? "").trim() || null,
    passed,
    valid_until: validUntil,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteTrainingRecord(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("training_record").delete().eq("id", id);
  revalidatePath("/", "layout");
}
