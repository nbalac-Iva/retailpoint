import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, Empty, Field, formGrid, inputClass, PageHeader, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { fullName, one } from "@/lib/format";
import {
  addExamReq,
  addTrainingReq,
  deletePosition,
  removeExamReq,
  removeTrainingReq,
  updatePosition,
} from "../actions";
import { PositionFields } from "../position-fields";

export default async function PositionPage(props: PageProps<"/radna-mesta/[id]">) {
  const { id } = await props.params;
  const { supabase, companyId, canEdit } = await getContext();

  const [{ data: position }, { data: examTypes }, { data: programs }] = await Promise.all([
    supabase
      .from("job_position")
      .select(
        `id, name, code, is_high_risk, description,
         position_exam_req (id, interval_months, exam_type (name)),
         position_training_req (id, training_program (name, validity_months)),
         employee (id, first_name, last_name, status)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("exam_type").select("id, name").order("name"),
    supabase.from("training_program").select("id, name").eq("company_id", companyId).order("name"),
  ]);

  if (!position) notFound();

  const removeButton = "text-sm text-red-700 hover:underline";

  return (
    <>
      <PageHeader title={position.name}>
        <Link href="/radna-mesta" className="text-sm text-blue-700 hover:underline">
          ← Sva radna mesta
        </Link>
      </PageHeader>

      <Card title="Obavezni lekarski pregledi">
        {!position.position_exam_req.length ? (
          <Empty>Nema obaveznih pregleda.</Empty>
        ) : (
          <Table head={["Pregled", "Ponavlja se", ""]}>
            {position.position_exam_req.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2">{one(r.exam_type)?.name}</td>
                <td className="px-2 py-2">{r.interval_months ? `na ${r.interval_months} meseci` : "jednom"}</td>
                <td className="px-2 py-2 text-right">
                  {canEdit && (
                    <form action={removeExamReq.bind(null, r.id)}>
                      <button className={removeButton}>Ukloni</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {canEdit && (
          <ActionForm action={addExamReq.bind(null, position.id)} submitLabel="Dodaj pregled" className={`${formGrid} mt-4`}>
            <Field label="Vrsta pregleda">
              <select name="exam_type_id" required className={inputClass}>
                <option value="">Izaberite…</option>
                {examTypes?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ponavlja se na (meseci, prazno = jednom)">
              <input name="interval_months" type="number" min={1} className={inputClass} />
            </Field>
          </ActionForm>
        )}
      </Card>

      <Card title="Obavezne obuke">
        {!position.position_training_req.length ? (
          <Empty>Nema obaveznih obuka.</Empty>
        ) : (
          <Table head={["Obuka", "Važi", ""]}>
            {position.position_training_req.map((r) => {
              const program = one(r.training_program);
              return (
                <tr key={r.id}>
                  <td className="px-2 py-2">{program?.name}</td>
                  <td className="px-2 py-2">
                    {program?.validity_months ? `${program.validity_months} meseci` : "bez roka"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {canEdit && (
                      <form action={removeTrainingReq.bind(null, r.id)}>
                        <button className={removeButton}>Ukloni</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        {canEdit &&
          (programs?.length ? (
            <ActionForm action={addTrainingReq.bind(null, position.id)} submitLabel="Dodaj obuku" className={`${formGrid} mt-4`}>
              <Field label="Obuka">
                <select name="training_program_id" required className={inputClass}>
                  <option value="">Izaberite…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </ActionForm>
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

      <Card title="Zaposleni na ovom radnom mestu">
        {!position.employee.length ? (
          <Empty>Niko nije raspoređen.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {position.employee.map((e) => (
              <li key={e.id}>
                <Link href={`/zaposleni/${e.id}`} className="text-blue-700 hover:underline">
                  {fullName(e)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canEdit && (
        <Card title="Podaci o radnom mestu">
          <ActionForm
            action={updatePosition.bind(null, position.id)}
            submitLabel="Sačuvaj izmene"
            className={formGrid}
            resetOnSuccess={false}
          >
            <PositionFields position={position} />
          </ActionForm>
          <form action={deletePosition.bind(null, position.id)} className="mt-6 border-t border-gray-100 pt-4">
            <ConfirmButton message={`Obrisati radno mesto „${position.name}“?`} className={removeButton}>
              Obriši radno mesto
            </ConfirmButton>
            <span className="ml-2 text-xs text-gray-500">Zaposleni ostaju, ali bez radnog mesta.</span>
          </form>
        </Card>
      )}
    </>
  );
}
