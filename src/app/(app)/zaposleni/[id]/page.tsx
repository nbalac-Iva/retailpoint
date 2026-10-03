import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ConfirmButton } from "@/components/confirm-button";
import { EmployeeFields, ExamFields, PpeIssueFields, TrainingFields } from "@/components/forms";
import { Card, Empty, formGrid, PageHeader, StatusBadge, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import {
  EXAM_RESULT_LABEL,
  formatDate,
  fullName,
  one,
  REQUIREMENT_TYPE_LABEL,
  TRAINING_REASON_LABEL,
  type ComplianceStatus,
} from "@/lib/format";
import { addExam, deleteExam } from "../../lekarski-pregledi/actions";
import { issuePpe } from "../../lzo/actions";
import { IssueTable } from "../../lzo/issue-table";
import { addTrainingRecord, deleteTrainingRecord } from "../../obuke/actions";
import { deleteEmployee, updateEmployee } from "../actions";

const removeButton = "text-sm text-red-700 hover:underline";

export default async function EmployeePage(props: PageProps<"/zaposleni/[id]">) {
  const { id } = await props.params;
  const { supabase, companyId, canEdit } = await getContext();

  const [
    { data: employee },
    { data: compliance },
    { data: exams },
    { data: trainings },
    { data: positions },
    { data: examTypes },
    { data: programs },
    { data: ppeIssues },
    { data: ppeItems },
  ] =
    await Promise.all([
      supabase
        .from("employee")
        .select("id, first_name, last_name, job_position_id, employed_from, status, note, job_position (id, name)")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("compliance_status").select("*").eq("employee_id", id),
      supabase
        .from("medical_exam")
        .select("id, exam_date, result, restrictions, valid_until, institution, exam_type (name)")
        .eq("employee_id", id)
        .order("exam_date", { ascending: false }),
      supabase
        .from("training_record")
        .select("id, held_on, reason, trainer, passed, valid_until, training_program (name)")
        .eq("employee_id", id)
        .order("held_on", { ascending: false }),
      supabase.from("job_position").select("id, name").eq("company_id", companyId).order("name"),
      supabase.from("exam_type").select("id, name").order("name"),
      supabase.from("training_program").select("id, name").eq("company_id", companyId).order("name"),
      supabase
        .from("ppe_issue")
        .select("id, size, quantity, issued_on, replace_by, returned_on, ppe_item (name)")
        .eq("employee_id", id)
        .order("issued_on", { ascending: false }),
      supabase.from("ppe_item").select("id, name").eq("company_id", companyId).order("name"),
    ]);

  if (!employee) notFound();
  const position = one(employee.job_position);

  return (
    <>
      <PageHeader title={fullName(employee)}>
        <Link href="/zaposleni" className="text-sm text-blue-700 hover:underline">
          ← Svi zaposleni
        </Link>
      </PageHeader>

      <Card title={`Obaveze radnog mesta${position ? `: ${position.name}` : ""}`}>
        {!position ? (
          <Empty>Zaposleni nije raspoređen na radno mesto, pa nema obaveza.</Empty>
        ) : !compliance?.length ? (
          <Empty>
            Radno mesto nema obavezne preglede ni obuke.{" "}
            <Link href={`/radna-mesta/${position.id}`} className="text-blue-700 hover:underline">
              Dodajte ih
            </Link>
            .
          </Empty>
        ) : (
          <Table head={["Obaveza", "Vrsta", "Važi do", "Status"]}>
            {compliance.map((r: { requirement_id: string; requirement_type: string; requirement_name: string; valid_until: string | null; status: ComplianceStatus }) => (
              <tr key={`${r.requirement_type}-${r.requirement_id}`}>
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

      {canEdit && (
        <Card title="Lekarski pregledi">
          {!exams?.length ? (
            <Empty>Nema unetih pregleda.</Empty>
          ) : (
            <Table head={["Datum", "Pregled", "Nalaz", "Važi do", "Ustanova", ""]}>
              {exams.map((x) => (
                <tr key={x.id}>
                  <td className="px-2 py-2">{formatDate(x.exam_date)}</td>
                  <td className="px-2 py-2">{one(x.exam_type)?.name}</td>
                  <td className="px-2 py-2">
                    {EXAM_RESULT_LABEL[x.result]}
                    {x.restrictions && <span className="block text-xs text-gray-600">{x.restrictions}</span>}
                  </td>
                  <td className="px-2 py-2">{x.valid_until ? formatDate(x.valid_until) : "bez roka"}</td>
                  <td className="px-2 py-2 text-gray-600">{x.institution ?? "—"}</td>
                  <td className="px-2 py-2 text-right">
                    <form action={deleteExam.bind(null, x.id)}>
                      <ConfirmButton message="Obrisati ovaj pregled?" className={removeButton}>
                        Obriši
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Unesi pregled</h3>
          <ActionForm action={addExam} submitLabel="Sačuvaj pregled" className={formGrid}>
            <ExamFields examTypes={examTypes ?? []} employeeId={employee.id} />
          </ActionForm>
        </Card>
      )}

      <Card title="Lična zaštitna oprema">
        {!ppeIssues?.length ? (
          <Empty>Nema zaduženja.</Empty>
        ) : (
          <IssueTable issues={ppeIssues} canEdit={canEdit} showEmployee={false} />
        )}
        {canEdit &&
          (ppeItems?.length ? (
            <>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Zaduži opremu</h3>
              <ActionForm action={issuePpe} submitLabel="Zaduži" className={formGrid}>
                <PpeIssueFields items={ppeItems} employeeId={employee.id} />
              </ActionForm>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Prvo dodajte opremu na stranici{" "}
              <Link href="/lzo" className="text-blue-700 hover:underline">
                LZO
              </Link>
              .
            </p>
          ))}
      </Card>

      <Card title="Obuke">
        {!trainings?.length ? (
          <Empty>Nema unetih obuka.</Empty>
        ) : (
          <Table head={["Datum", "Obuka", "Povod", "Provera", "Važi do", ""]}>
            {trainings.map((t) => (
              <tr key={t.id}>
                <td className="px-2 py-2">{formatDate(t.held_on)}</td>
                <td className="px-2 py-2">{one(t.training_program)?.name}</td>
                <td className="px-2 py-2 text-gray-600">{t.reason ? TRAINING_REASON_LABEL[t.reason] : "—"}</td>
                <td className="px-2 py-2">{t.passed ? "položio" : "nije položio"}</td>
                <td className="px-2 py-2">{t.valid_until ? formatDate(t.valid_until) : t.passed ? "bez roka" : "—"}</td>
                <td className="px-2 py-2 text-right">
                  {canEdit && (
                    <form action={deleteTrainingRecord.bind(null, t.id)}>
                      <ConfirmButton message="Obrisati ovu obuku?" className={removeButton}>
                        Obriši
                      </ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {canEdit &&
          (programs?.length ? (
            <>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Unesi obuku</h3>
              <ActionForm action={addTrainingRecord} submitLabel="Sačuvaj obuku" className={formGrid}>
                <TrainingFields programs={programs} employeeId={employee.id} />
              </ActionForm>
            </>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Prvo dodajte obuku na stranici{" "}
              <Link href="/obuke" className="text-blue-700 hover:underline">
                Obuke
              </Link>
              .
            </p>
          ))}
      </Card>

      {canEdit && (
        <Card title="Podaci o zaposlenom">
          <ActionForm
            action={updateEmployee.bind(null, employee.id)}
            submitLabel="Sačuvaj izmene"
            className={formGrid}
            resetOnSuccess={false}
          >
            <EmployeeFields positions={positions ?? []} employee={employee} />
          </ActionForm>
          <form action={deleteEmployee.bind(null, employee.id)} className="mt-6 border-t border-gray-100 pt-4">
            <ConfirmButton
              message={`Obrisati zaposlenog ${fullName(employee)} sa svim pregledima i obukama?`}
              className={removeButton}
            >
              Obriši zaposlenog
            </ConfirmButton>
            <span className="ml-2 text-xs text-gray-500">Za bivše zaposlene bolje je promeniti status.</span>
          </form>
        </Card>
      )}
    </>
  );
}
