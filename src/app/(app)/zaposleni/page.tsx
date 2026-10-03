import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { EmployeeFields } from "@/components/forms";
import { Card, Empty, formGrid, PageHeader, StatusBadge, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { EMPLOYEE_STATUS_LABEL, fullName, one, type ComplianceStatus } from "@/lib/format";
import { createEmployee } from "./actions";

const WORST: ComplianceStatus[] = ["expired", "missing", "expiring", "ok"];

export default async function EmployeesPage() {
  const { supabase, companyId, canEdit } = await getContext();

  const [{ data: employees }, { data: positions }, { data: compliance }] = await Promise.all([
    supabase
      .from("employee")
      .select("id, first_name, last_name, status, job_position (name)")
      .eq("company_id", companyId)
      .order("last_name"),
    supabase.from("job_position").select("id, name").eq("company_id", companyId).order("name"),
    supabase.from("compliance_status").select("employee_id, status").eq("company_id", companyId),
  ]);

  // Najlošiji status po zaposlenom, za kolonu „Usklađenost“.
  const worst = new Map<string, ComplianceStatus>();
  for (const row of (compliance ?? []) as { employee_id: string; status: ComplianceStatus }[]) {
    const current = worst.get(row.employee_id);
    if (!current || WORST.indexOf(row.status) < WORST.indexOf(current)) worst.set(row.employee_id, row.status);
  }

  return (
    <>
      <PageHeader title="Zaposleni">
        {canEdit && (
          <Link
            href="/zaposleni/uvoz"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
          >
            Uvezi iz Excela
          </Link>
        )}
      </PageHeader>

      <Card>
        {!employees?.length ? (
          <Empty>Još nema zaposlenih.</Empty>
        ) : (
          <Table head={["Ime i prezime", "Radno mesto", "Status", "Usklađenost"]}>
            {employees.map((e) => {
              const status = worst.get(e.id);
              return (
                <tr key={e.id}>
                  <td className="px-2 py-2">
                    <Link href={`/zaposleni/${e.id}`} className="text-blue-700 hover:underline">
                      {fullName(e)}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{one(e.job_position)?.name ?? "—"}</td>
                  <td className="px-2 py-2 text-gray-600">{EMPLOYEE_STATUS_LABEL[e.status]}</td>
                  <td className="px-2 py-2">{status ? <StatusBadge status={status} /> : "—"}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {canEdit && (
        <Card title="Novi zaposleni">
          <ActionForm action={createEmployee} submitLabel="Dodaj zaposlenog" className={formGrid}>
            <EmployeeFields positions={positions ?? []} />
          </ActionForm>
        </Card>
      )}
    </>
  );
}
