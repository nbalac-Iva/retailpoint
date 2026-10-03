import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, inputClass } from "@/components/ui";
import { login, requestPasswordReset, signup } from "./actions";

type Mode = "login" | "signup" | "reset";

const SUBTITLE: Record<Mode, string> = {
  login: "Prijavite se na svoj nalog.",
  signup: "Napravite nalog za svoju firmu.",
  reset: "Unesite email naloga i poslaćemo vam link za novu lozinku.",
};

const link = "text-blue-700 hover:underline";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const mode: Mode = params.registracija === "1" ? "signup" : params.zaboravljena === "1" ? "reset" : "login";

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">RetailPoint BZR</h1>
        <p className="mb-6 text-sm text-gray-600">{SUBTITLE[mode]}</p>

        {params.poslato === "1" && (
          <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            Poslali smo vam email. Kliknite na link u njemu, pa se prijavite.
          </p>
        )}
        {params.reset === "poslato" && (
          <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            Ako nalog sa tim emailom postoji, poslali smo link za novu lozinku. Otvorite ga u ovom browseru.
          </p>
        )}
        {params.greska === "potvrda" && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            Link nije važeći ili je istekao. Pokušajte ponovo.
          </p>
        )}

        {mode === "reset" ? (
          <ActionForm
            key="reset"
            action={requestPasswordReset}
            submitLabel="Pošalji link"
            className="flex flex-col gap-4"
            resetOnSuccess={false}
          >
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </Field>
          </ActionForm>
        ) : (
          <ActionForm
            key={mode}
            action={mode === "signup" ? signup : login}
            submitLabel={mode === "signup" ? "Napravi nalog" : "Prijavi se"}
            className="flex flex-col gap-4"
            resetOnSuccess={false}
          >
            <Field label="Email">
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </Field>
            <Field label="Lozinka">
              <input
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputClass}
              />
            </Field>
          </ActionForm>
        )}

        <div className="mt-6 space-y-2 text-sm text-gray-600">
          {mode === "login" && (
            <>
              <p>
                <Link href="/login?zaboravljena=1" className={link}>
                  Zaboravili ste lozinku?
                </Link>
              </p>
              <p>
                Nemate nalog?{" "}
                <Link href="/login?registracija=1" className="font-medium text-blue-700 underline">
                  Registrujte se
                </Link>
              </p>
            </>
          )}
          {mode !== "login" && (
            <p>
              <Link href="/login" className={link}>
                ← Nazad na prijavu
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
