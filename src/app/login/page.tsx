import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, inputClass } from "@/components/ui";
import { login, signup } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const isSignup = params.registracija === "1";

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">RetailPoint BZR</h1>
        <p className="mb-6 text-sm text-gray-600">
          {isSignup ? "Napravite nalog za svoju firmu." : "Prijavite se na svoj nalog."}
        </p>

        {params.poslato === "1" && (
          <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            Poslali smo vam email. Kliknite na link u njemu, pa se prijavite.
          </p>
        )}
        {params.greska === "potvrda" && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            Link za potvrdu nije važeći ili je istekao. Pokušajte ponovo.
          </p>
        )}

        <ActionForm
          key={isSignup ? "signup" : "login"}
          action={isSignup ? signup : login}
          submitLabel={isSignup ? "Napravi nalog" : "Prijavi se"}
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
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={inputClass}
            />
          </Field>
        </ActionForm>

        <p className="mt-6 text-sm text-gray-600">
          {isSignup ? (
            <>
              Već imate nalog?{" "}
              <Link href="/login" className="text-blue-700 hover:underline">
                Prijavite se
              </Link>
            </>
          ) : (
            <>
              Nemate nalog?{" "}
              <Link href="/login?registracija=1" className="font-medium text-blue-700 underline">
                Registrujte se
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
