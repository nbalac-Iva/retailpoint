import { Nav } from "@/components/nav";
import { getContext } from "@/lib/context";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { company, email, canEdit } = await getContext();

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-gray-900">{company.name}</span>
            <Nav />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {email}
              {!canEdit && " (samo pregled)"}
            </span>
            <form action={logout}>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50">Odjava</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
