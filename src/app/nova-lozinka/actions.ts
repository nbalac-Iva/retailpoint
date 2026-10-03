"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";

export async function setNewPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");
  if (password.length < 8) return { error: "Lozinka mora imati bar 8 znakova." };
  if (password !== repeat) return { error: "Lozinke se ne poklapaju." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { error: "Nova lozinka mora biti drugačija od stare." };
  if (error) return { error: error.message };
  redirect("/");
}
