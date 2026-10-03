import Link from "next/link";
import { Card, Empty, PageHeader, StatusBadge, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import {
  formatDate,
  fullName,
  REQUIREMENT_TYPE_LABEL,
  STATUS_CLASS,
  STATUS_LABEL,
  type ComplianceStatus,
} from "@/lib/format";

type Row = {
  employee_id: string;
  first_name: string;
  last_name: string;
  requirement_type: "exam" | "training" | "ppe";
  requirement_name: string;
  valid_until: string | null;
  status: ComplianceStatus;
};

const ORDER: ComplianceStatus[] = ["expired", "missing", "expiring", "ok"];

export default async function DashboardPage() {
  const { supabase, companyId } = await getContext();

  const [{ data: rows }, { count: employeeCount }] = await Promise.all([
    supabase.from("compliance_status").select("*").eq("company_id", companyId),
    supabase
      .from("employee")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active"),
  ]);

  const all = (rows ?? []) as Row[];
  const counts = Object.fromEntries(ORDER.map((s) => [s, all.filter((r) => r.status === s).length]));
  const problems = all
    .filter((r) => r.status !== "ok")
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (a.valid_until ?? "").localeCompare(b.valid_until ?? ""));

  return (
    <>
      <PageHeader title="Pregled usklađenosti" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Aktivni zaposleni</p>
          <p className="text-2xl font-semibold text-gray-900">{employeeCount ?? 0}</p>
        </div>
        {ORDER.map((s) => (
          <div key={s} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${STATUS_CLASS[s]}`} />
              {STATUS_LABEL[s]}
            </p>
            <p className="text-2xl font-semibold text-gray-900">{counts[s]}</p>
          </div>
        ))}
      </div>

      <Card title="Šta treba rešiti">
        {all.length === 0 ? (
          <Empty>
            Još nema obaveza. Dodajte <Link href="/radna-mesta" className="text-blue-700 hover:underline">radna mesta</Link>{" "}
            sa obaveznim pregledima, obukama i LZO, pa im rasporedite{" "}
            <Link href="/zaposleni" className="text-blue-700 hover:underline">zaposlene</Link>.
          </Empty>
        ) : problems.length === 0 ? (
          <Empty>Sve obaveze su važeće.</Empty>
        ) : (
          <Table head={["Zaposleni", "Obaveza", "Vrsta", "Važi do", "Status"]}>
            {problems.map((r) => (
              <tr key={`${r.employee_id}-${r.requirement_type}-${r.requirement_name}`}>
                <td className="px-2 py-2">
                  <Link href={`/zaposleni/${r.employee_id}`} className="text-blue-700 hover:underline">
                    {fullName(r)}
                  </Link>
                </td>
                <td className="px-2 py-2">{r.requirement_name}</td>
                <td className="px-2 py-2 text-gray-600">{REQUIREMENT_TYPE_LABEL[r.requirement_type]}</td>
                <td className="px-2 py-2">{formatDate(r.valid_until)}</td>
                <td className="px-2 py-2">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
