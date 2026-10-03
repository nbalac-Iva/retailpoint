import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmButton } from "@/components/confirm-button";
import { ExamFields } from "@/components/forms";
import { Card, Empty, formGrid, PageHeader, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { EXAM_RESULT_LABEL, formatDate, fullName, one } from "@/lib/format";
import { addExam, deleteExam } from "./actions";

export default async function ExamsPage() {
  const { supabase, companyId, canEdit } = await getContext();

  if (!canEdit) {
    return (
      <>
        <PageHeader title="Lekarski pregledi" />
        <Card>
          <Empty>Zdravstvene podatke vide samo administrator i lice za BZR.</Empty>
        </Card>
      </>
    );
  }

  const [{ data: exams }, { data: employees }, { data: examTypes }] = await Promise.all([
    supabase
      .from("medical_exam")
      .select("id, exam_date, result, valid_until, institution, exam_type (name), employee (id, first_name, last_name)")
      .eq("company_id", companyId)
      .order("exam_date", { ascending: false })
      .limit(200),
    supabase
      .from("employee")
      .select("id, first_name, last_name")
      .eq("company_id", companyId)
      .neq("status", "terminated")
      .order("last_name"),
    supabase.from("exam_type").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader title="Lekarski pregledi" />

      <Card title="Unesi pregled">
        {employees?.length ? (
          <ActionForm action={addExam} submitLabel="Sačuvaj pregled" className={formGrid}>
            <ExamFields examTypes={examTypes ?? []} employees={employees} />
          </ActionForm>
        ) : (
          <Empty>
            Prvo dodajte <Link href="/zaposleni" className="text-blue-700 hover:underline">zaposlene</Link>.
          </Empty>
        )}
      </Card>

      <Card title="Poslednji pregledi">
        {!exams?.length ? (
          <Empty>Još nema unetih pregleda.</Empty>
        ) : (
          <Table head={["Datum", "Zaposleni", "Pregled", "Nalaz", "Važi do", "Ustanova", ""]}>
            {exams.map((x) => {
              const employee = one(x.employee)!;
              return (
              <tr key={x.id}>
                <td className="px-2 py-2">{formatDate(x.exam_date)}</td>
                <td className="px-2 py-2">
                  <Link href={`/zaposleni/${employee.id}`} className="text-blue-700 hover:underline">
                    {fullName(employee)}
                  </Link>
                </td>
                <td className="px-2 py-2">{one(x.exam_type)?.name}</td>
                <td className="px-2 py-2">{EXAM_RESULT_LABEL[x.result]}</td>
                <td className="px-2 py-2">{x.valid_until ? formatDate(x.valid_until) : "bez roka"}</td>
                <td className="px-2 py-2 text-gray-600">{x.institution ?? "—"}</td>
                <td className="px-2 py-2 text-right">
                  <form action={deleteExam.bind(null, x.id)}>
                    <ConfirmButton message="Obrisati ovaj pregled?" className="text-sm text-red-700 hover:underline">
                      Obriši
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
