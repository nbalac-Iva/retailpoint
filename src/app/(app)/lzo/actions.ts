"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/action-form";
import { getContext, NO_EDIT } from "@/lib/context";
import { addMonths } from "@/lib/format";

function positiveInt(value: FormDataEntryValue | null): number | null {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Unesite naziv opreme." };

  const { error } = await supabase.from("ppe_item").insert({
    company_id: companyId,
    name,
    standard: String(formData.get("standard") ?? "").trim() || null,
    replacement_months: positiveInt(formData.get("replacement_months")),
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteItem(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("ppe_item").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function issuePpe(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;

  const employeeId = String(formData.get("employee_id") ?? "");
  const itemId = String(formData.get("ppe_item_id") ?? "");
  const issuedOn = String(formData.get("issued_on") ?? "");
  if (!employeeId || !itemId || !issuedOn) return { error: "Popunite zaposlenog, opremu i datum." };

  // Rok zamene: unet ručno, inače iz normativa radnog mesta, inače sa artikla.
  let replaceBy = String(formData.get("replace_by") ?? "") || null;
  if (!replaceBy) {
    const [{ data: employee }, { data: item }] = await Promise.all([
      supabase.from("employee").select("job_position_id").eq("id", employeeId).single(),
      supabase.from("ppe_item").select("replacement_months").eq("id", itemId).single(),
    ]);
    let months: number | null = item?.replacement_months ?? null;
    if (employee?.job_position_id) {
      const { data: norm } = await supabase
        .from("ppe_norm")
        .select("replacement_months")
        .eq("job_position_id", employee.job_position_id)
        .eq("ppe_item_id", itemId)
        .maybeSingle();
      months = norm?.replacement_months ?? months;
    }
    if (months) replaceBy = addMonths(issuedOn, months);
  }

  const { error } = await supabase.from("ppe_issue").insert({
    company_id: companyId,
    employee_id: employeeId,
    ppe_item_id: itemId,
    size: String(formData.get("size") ?? "").trim() || null,
    quantity: positiveInt(formData.get("quantity")) ?? 1,
    issued_on: issuedOn,
    replace_by: replaceBy,
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function returnPpe(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("ppe_issue").update({ returned_on: today() }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteIssue(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("ppe_issue").delete().eq("id", id);
  revalidatePath("/", "layout");
}
