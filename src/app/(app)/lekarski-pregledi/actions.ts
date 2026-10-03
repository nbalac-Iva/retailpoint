"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/action-form";
import { getContext, NO_EDIT } from "@/lib/context";
import { addMonths } from "@/lib/format";

export async function addExam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return NO_EDIT;

  const employeeId = String(formData.get("employee_id") ?? "");
  const examTypeId = String(formData.get("exam_type_id") ?? "");
  const examDate = String(formData.get("exam_date") ?? "");
  const result = String(formData.get("result") ?? "");
  if (!employeeId || !examTypeId || !examDate || !result) {
    return { error: "Popunite zaposlenog, vrstu pregleda, datum i nalaz." };
  }

  // Bez unetog roka: rok = datum pregleda + interval sa radnog mesta zaposlenog.
  let validUntil = String(formData.get("valid_until") ?? "") || null;
  if (!validUntil && result !== "nesposoban") {
    const { data: employee } = await supabase
      .from("employee")
      .select("job_position_id")
      .eq("id", employeeId)
      .single();
    if (employee?.job_position_id) {
      const { data: req } = await supabase
        .from("position_exam_req")
        .select("interval_months")
        .eq("job_position_id", employee.job_position_id)
        .eq("exam_type_id", examTypeId)
        .maybeSingle();
      if (req?.interval_months) validUntil = addMonths(examDate, req.interval_months);
    }
  }

  const { error } = await supabase.from("medical_exam").insert({
    company_id: companyId,
    employee_id: employeeId,
    exam_type_id: examTypeId,
    exam_date: examDate,
    result,
    restrictions: String(formData.get("restrictions") ?? "").trim() || null,
    institution: String(formData.get("institution") ?? "").trim() || null,
    valid_until: validUntil,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function deleteExam(id: string) {
  const { supabase, canEdit } = await getContext();
  if (!canEdit) return;
  await supabase.from("medical_exam").delete().eq("id", id);
  revalidatePath("/", "layout");
}
