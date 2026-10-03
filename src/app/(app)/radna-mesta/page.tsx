import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Card, Empty, formGrid, PageHeader, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { createPosition } from "./actions";
import { PositionFields } from "./position-fields";

export default async function PositionsPage() {
  const { supabase, companyId, canEdit } = await getContext();

  const { data: positions } = await supabase
    .from("job_position")
    .select("id, name, code, is_high_risk, employee(count), position_exam_req(count), position_training_req(count), ppe_norm(count)")
    .eq("company_id", companyId)
    .order("name");

  return (
    <>
      <PageHeader title="Radna mesta" />

      <Card>
        {!positions?.length ? (
          <Empty>Još nema radnih mesta.</Empty>
        ) : (
          <Table head={["Naziv", "Šifra", "Povećan rizik", "Zaposleni", "Pregledi", "Obuke", "LZO"]}>
            {positions.map((p) => (
              <tr key={p.id}>
                <td className="px-2 py-2">
                  <Link href={`/radna-mesta/${p.id}`} className="text-blue-700 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-2 py-2 text-gray-600">{p.code ?? "—"}</td>
                <td className="px-2 py-2">{p.is_high_risk ? "Da" : "Ne"}</td>
                <td className="px-2 py-2">{p.employee[0]?.count ?? 0}</td>
                <td className="px-2 py-2">{p.position_exam_req[0]?.count ?? 0}</td>
                <td className="px-2 py-2">{p.position_training_req[0]?.count ?? 0}</td>
                <td className="px-2 py-2">{p.ppe_norm[0]?.count ?? 0}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {canEdit && (
        <Card title="Novo radno mesto">
          <ActionForm action={createPosition} submitLabel="Dodaj radno mesto" className={formGrid}>
            <PositionFields />
          </ActionForm>
        </Card>
      )}
    </>
  );
}
