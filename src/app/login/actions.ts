"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials(formData));
  if (error?.code === "email_not_confirmed") {
    return { error: "Email još nije potvrđen. Kliknite na link iz emaila koji smo vam poslali." };
  }
  if (error) return { error: "Pogrešan email ili lozinka. Ako još nemate nalog, kliknite „Registrujte se“ ispod." };
  redirect("/");
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { email, password } = credentials(formData);
  if (password.length < 8) return { error: "Lozinka mora imati bar 8 znakova." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };

  // Bez sesije znači da Supabase traži potvrdu emaila.
  if (!data.session) redirect("/login?poslato=1");
  redirect("/pocetak");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
