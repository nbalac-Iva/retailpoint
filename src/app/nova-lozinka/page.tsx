import { ActionForm } from "@/components/action-form";
import { Field, inputClass } from "@/components/ui";
import { setNewPassword } from "./actions";

// Do ove stranice se stiže iz linka za novu lozinku (proxy traži prijavu).
export default function NewPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">Nova lozinka</h1>
        <p className="mb-6 text-sm text-gray-600">Unesite novu lozinku, bar 8 znakova.</p>
        <ActionForm action={setNewPassword} submitLabel="Sačuvaj lozinku" className="flex flex-col gap-4" resetOnSuccess={false}>
          <Field label="Nova lozinka">
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="Ponovite lozinku">
            <input name="repeat" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
        </ActionForm>
      </div>
    </main>
  );
}
