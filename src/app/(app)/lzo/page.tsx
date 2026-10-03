import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ConfirmButton } from "@/components/confirm-button";
import { PpeIssueFields } from "@/components/forms";
import { Card, Empty, Field, formGrid, inputClass, PageHeader, Table } from "@/components/ui";
import { getContext } from "@/lib/context";
import { createItem, deleteItem, issuePpe } from "./actions";
import { IssueTable } from "./issue-table";

export default async function PpePage(props: PageProps<"/lzo">) {
  const { sve } = await props.searchParams;
  const showAll = sve === "1";
  const { supabase, companyId, canEdit } = await getContext();

  let issuesQuery = supabase
    .from("ppe_issue")
    .select("id, size, quantity, issued_on, replace_by, returned_on, ppe_item (name), employee (id, first_name, last_name)")
    .eq("company_id", companyId)
    .order("issued_on", { ascending: false })
    .limit(300);
  if (!showAll) issuesQuery = issuesQuery.is("returned_on", null);

  const [{ data: items }, { data: issues }, { data: employees }] = await Promise.all([
    supabase
      .from("ppe_item")
      .select("id, name, standard, replacement_months, ppe_issue(count)")
      .eq("company_id", companyId)
      .order("name"),
    issuesQuery,
    supabase
      .from("employee")
      .select("id, first_name, last_name")
      .eq("company_id", companyId)
      .neq("status", "terminated")
      .order("last_name"),
  ]);

  return (
    <>
      <PageHeader title="Lična zaštitna oprema" />

      {canEdit && !!items?.length && (
        <Card title="Zaduži opremu">
          {employees?.length ? (
            <ActionForm action={issuePpe} submitLabel="Zaduži" className={formGrid}>
              <PpeIssueFields items={items} employees={employees} />
            </ActionForm>
          ) : (
            <Empty>
              Prvo dodajte <Link href="/zaposleni" className="text-blue-700 hover:underline">zaposlene</Link>.
            </Empty>
          )}
        </Card>
      )}

      <Card title={showAll ? "Sva zaduženja" : "Trenutna zaduženja"}>
        <p className="mb-3 text-sm">
          {showAll ? (
            <Link href="/lzo" className="text-blue-700 hover:underline">
              Prikaži samo trenutna
            </Link>
          ) : (
            <Link href="/lzo?sve=1" className="text-blue-700 hover:underline">
              Prikaži i razdužena
            </Link>
          )}
        </p>
        {!issues?.length ? <Empty>Nema zaduženja.</Empty> : <IssueTable issues={issues} canEdit={canEdit} showEmployee />}
      </Card>

      <Card title="Oprema">
        {!items?.length ? (
          <Empty>Još nema opreme. Dodajte prvu, na primer „Zaštitne cipele S3“ ili „Zaštitni šlem“.</Empty>
        ) : (
          <Table head={["Naziv", "Standard", "Rok zamene", "Zaduženja", ""]}>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="px-2 py-2">{i.name}</td>
                <td className="px-2 py-2 text-gray-600">{i.standard ?? "—"}</td>
                <td className="px-2 py-2">{i.replacement_months ? `${i.replacement_months} meseci` : "bez roka"}</td>
                <td className="px-2 py-2">{i.ppe_issue[0]?.count ?? 0}</td>
                <td className="px-2 py-2 text-right">
                  {canEdit && (
                    <form action={deleteItem.bind(null, i.id)}>
                      <ConfirmButton
                        message={`Obrisati „${i.name}“ zajedno sa normativima i svim zaduženjima?`}
                        className="text-sm text-red-700 hover:underline"
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
          <ActionForm action={createItem} submitLabel="Dodaj opremu" className={`${formGrid} mt-4`}>
            <Field label="Naziv">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="Standard (nije obavezno)">
              <input name="standard" placeholder="npr. EN ISO 20345" className={inputClass} />
            </Field>
            <Field label="Rok zamene (meseci, prazno = bez roka)">
              <input name="replacement_months" type="number" min={1} className={inputClass} />
            </Field>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
