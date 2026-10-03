"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { getContext, NO_EDIT } from "@/lib/context";

function positionFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim() || null,
    is_high_risk: formData.get("is_high_risk") === "on",
    description: String(formData.get("description") ?? "").trim() || null,
  };
}

function optionalInt(value: FormDataEntryValue | null): number | null {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createPosition(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const fields = positionFields(formData);
  if (!fields.name) return { error: "Unesite naziv radnog mesta." };

  const { data, error } = await supabase
    .from("job_position")
    .insert({ ...fields, company_id: companyId })
    .select("id")
    .single();
  if (error) return { error: error.message };
  redirect(`/radna-mesta/${data.id}`);
}

export async function updatePosition(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const fields = positionFields(formData);
  if (!fields.name) return { error: "Unesite naziv radnog mesta." };

  const { error } = await supabase.from("job_position").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deletePosition(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("job_position").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/radna-mesta");
}

export async function addExamReq(positionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const examTypeId = String(formData.get("exam_type_id") ?? "");
  if (!examTypeId) return { error: "Izaberite vrstu pregleda." };

  const { error } = await supabase.from("position_exam_req").insert({
    company_id: companyId,
    job_position_id: positionId,
    exam_type_id: examTypeId,
    interval_months: optionalInt(formData.get("interval_months")),
  });
  if (error) {
    return { error: error.code === "23505" ? "Ovaj pregled je već dodat." : error.message };
  }
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function addTrainingReq(positionId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const programId = String(formData.get("training_program_id") ?? "");
  if (!programId) return { error: "Izaberite obuku." };

  const { error } = await supabase.from("position_training_req").insert({
    company_id: companyId,
    job_position_id: positionId,
    training_program_id: programId,
  });
  if (error) {
    return { error: error.code === "23505" ? "Ova obuka je već dodata." : error.message };
  }
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function removeExamReq(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("position_exam_req").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function removeTrainingReq(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("position_training_req").delete().eq("id", id);
  revalidatePath("/", "layout");
}
