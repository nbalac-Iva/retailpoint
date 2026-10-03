import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Field, inputClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { createCompany } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { count } = await supabase.from("membership").select("company_id", { count: "exact", head: true });
  if (count) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Vaša firma</h1>
        <p className="mb-6 text-sm text-gray-600">
          Unesite firmu čije evidencije BZR vodite. Ostale podatke možete dopuniti kasnije.
        </p>
        <ActionForm action={createCompany} submitLabel="Nastavi" className="flex flex-col gap-4" resetOnSuccess={false}>
          <Field label="Naziv firme">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="PIB (nije obavezno)">
            <input name="pib" inputMode="numeric" className={inputClass} />
          </Field>
        </ActionForm>
      </div>
    </main>
  );
}
