"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";

export type ImportRow = {
  first_name: string;
  last_name: string;
  position: string | null;
  employed_from: string | null; // YYYY-MM-DD
};

export type ImportResult = {
  error?: string;
  created?: number;
  skipped?: number;
  positionsCreated?: number;
};

const MAX_ROWS = 2000;
const key = (s: string) => s.trim().toLocaleLowerCase("sr");

export async function importEmployees(rows: ImportRow[], createPositions: boolean): Promise<ImportResult> {
  const { supabase, companyId, canEdit } = await getContext();
  if (!canEdit) return { error: "Nemate pravo izmene." };
  if (!Array.isArray(rows) || rows.length === 0) return { error: "Nema redova za uvoz." };
  if (rows.length > MAX_ROWS) return { error: `Najviše ${MAX_ROWS} redova odjednom.` };

  const [{ data: positions, error: posError }, { data: existing, error: empError }] = await Promise.all([
    supabase.from("job_position").select("id, name").eq("company_id", companyId),
    supabase.from("employee").select("first_name, last_name").eq("company_id", companyId),
  ]);
  if (posError || empError) return { error: (posError ?? empError)!.message };

  const positionIds = new Map(positions!.map((p) => [key(p.name), p.id as string]));

  // Radna mesta iz fajla kojih još nema u bazi.
  let positionsCreated = 0;
  if (createPositions) {
    const missing = new Map<string, string>();
    for (const r of rows) {
      const name = r.position?.trim();
      if (name && !positionIds.has(key(name)) && !missing.has(key(name))) missing.set(key(name), name);
    }
    if (missing.size) {
      const { data: created, error } = await supabase
        .from("job_position")
        .insert([...missing.values()].map((name) => ({ company_id: companyId, name })))
        .select("id, name");
      if (error) return { error: error.message };
      for (const p of created) positionIds.set(key(p.name), p.id);
      positionsCreated = created.length;
    }
  }

  // Preskače zaposlene koji već postoje (isto ime i prezime) i duplikate unutar fajla.
  const seen = new Set(existing!.map((e) => `${key(e.first_name)}|${key(e.last_name)}`));
  const inserts = [];
  let skipped = 0;
  for (const r of rows) {
    const first = r.first_name?.trim();
    const last = r.last_name?.trim();
    const id = `${key(first ?? "")}|${key(last ?? "")}`;
    if (!first || !last || seen.has(id)) {
      skipped++;
      continue;
    }
    seen.add(id);
    inserts.push({
      company_id: companyId,
      first_name: first,
      last_name: last,
      job_position_id: r.position ? (positionIds.get(key(r.position)) ?? null) : null,
      employed_from: r.employed_from && /^\d{4}-\d{2}-\d{2}$/.test(r.employed_from) ? r.employed_from : null,
    });
  }

  for (let i = 0; i < inserts.length; i += 500) {
    const { error } = await supabase.from("employee").insert(inserts.slice(i, i + 500));
    if (error) return { error: `Uvezeno ${i} od ${inserts.length}, pa greška: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { created: inserts.length, skipped, positionsCreated };
}
