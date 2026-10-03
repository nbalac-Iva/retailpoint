import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmButton } from "@/components/confirm-button";
import { TrainingFields } from "@/components/forms";
import { Card, Empty, Field, formGrid, inputClass, PageHeader, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { formatDate, fullName, one, TRAINING_REASON_LABEL } from "@/lib/format";
import { addTrainingRecord, createProgram, deleteProgram, deleteTrainingRecord } from "./actions";

const removeButton = "text-sm text-red-700 hover:underline";

export default async function TrainingsPage() {
  const { supabase, companyId, canEdit } = await getContext();

  const [{ data: programs }, { data: records }, { data: employees }] = await Promise.all([
    supabase
      .from("training_program")
      .select("id, name, is_statutory, validity_months, training_record(count)")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("training_record")
      .select("id, held_on, reason, passed, valid_until, training_program (name), employee (id, first_name, last_name)")
      .eq("company_id", companyId)
      .order("held_on", { ascending: false })
      .limit(200),
    supabase
      .from("employee")
      .select("id, first_name, last_name")
      .eq("company_id", companyId)
      .neq("status", "terminated")
      .order("last_name"),
  ]);

  return (
    <>
      <PageHeader title="Obuke" />

      <Card title="Programi obuka">
        {!programs?.length ? (
          <Empty>Još nema programa obuka. Dodajte prvi, na primer „Osposobljavanje za bezbedan i zdrav rad“.</Empty>
        ) : (
          <Table head={["Naziv", "Zakonska", "Važi", "Održano", ""]}>
            {programs.map((p) => (
              <tr key={p.id}>
                <td className="px-2 py-2">{p.name}</td>
                <td className="px-2 py-2">{p.is_statutory ? "Da" : "Interna"}</td>
                <td className="px-2 py-2">{p.validity_months ? `${p.validity_months} meseci` : "bez roka"}</td>
                <td className="px-2 py-2">{p.training_record[0]?.count ?? 0}</td>
                <td className="px-2 py-2 text-right">
                  {canEdit && (
                    <form action={deleteProgram.bind(null, p.id)}>
                      <ConfirmButton
                        message={`Obrisati program „${p.name}“ zajedno sa svim unetim obukama?`}
                        className={removeButton}
                      >
                        Obriši
                      </ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {canEdit && (
          <ActionForm action={createProgram} submitLabel="Dodaj program" className={`${formGrid} mt-4`}>
            <Field label="Naziv obuke">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Važi (meseci, prazno = bez roka)">
              <input name="validity_months" type="number" min={1} className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input name="is_statutory" type="checkbox" defaultChecked />
              Zakonska obaveza
            </label>
          </ActionForm>
        )}
      </Card>

      {canEdit && !!programs?.length && (
        <Card title="Unesi održanu obuku">
          {employees?.length ? (
            <ActionForm action={addTrainingRecord} submitLabel="Sačuvaj obuku" className={formGrid}>
              <TrainingFields programs={programs} employees={employees} />
            </ActionForm>
          ) : (
            <Empty>
              Prvo dodajte <Link href="/zaposleni" className="text-blue-700 hover:underline">zaposlene</Link>.
            </Empty>
          )}
        </Card>
      )}

      <Card title="Poslednje obuke">
        {!records?.length ? (
          <Empty>Još nema unetih obuka.</Empty>
        ) : (
          <Table head={["Datum", "Zaposleni", "Obuka", "Povod", "Važi do", ""]}>
            {records.map((r) => {
              const employee = one(r.employee)!;
              return (
              <tr key={r.id}>
                <td className="px-2 py-2">{formatDate(r.held_on)}</td>
                <td className="px-2 py-2">
                  <Link href={`/zaposleni/${employee.id}`} className="text-blue-700 hover:underline">
                    {fullName(employee)}
                  </Link>
                </td>
                <td className="px-2 py-2">{one(r.training_program)?.name}</td>
                <td className="px-2 py-2 text-gray-600">{r.reason ? TRAINING_REASON_LABEL[r.reason] : "—"}</td>
                <td className="px-2 py-2">
                  {!r.passed ? "nije položio" : r.valid_until ? formatDate(r.valid_until) : "bez roka"}
                </td>
                <td className="px-2 py-2 text-right">
                  {canEdit && (
                    <form action={deleteTrainingRecord.bind(null, r.id)}>
                      <ConfirmButton message="Obrisati ovu obuku?" className={removeButton}>
                        Obriši
                      </ConfirmButton>
                    </form>
                  )}
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
