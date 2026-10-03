import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { Table } from "@/components/ui";
import { formatDate, fullName, one } from "@/lib/format";
import { deleteIssue, returnPpe } from "./actions";

type Issue = {
  id: string;
  size: string | null;
  quantity: number;
  issued_on: string;
  replace_by: string | null;
  returned_on: string | null;
  ppe_item: { name: string } | { name: string }[] | null;
  employee?: { id: string; first_name: string; last_name: string } | { id: string; first_name: string; last_name: string }[] | null;
};

const linkButton = "text-sm hover:underline";

function replaceStatus(issue: Issue): { label: string; className: string } {
  if (issue.returned_on) return { label: `razduženo ${formatDate(issue.returned_on)}`, className: "text-gray-500" };
  if (!issue.replace_by) return { label: "bez roka", className: "" };
  const today = new Date().toISOString().slice(0, 10);
  if (issue.replace_by < today) return { label: `${formatDate(issue.replace_by)} (isteklo)`, className: "text-red-700" };
  return { label: formatDate(issue.replace_by), className: "" };
}

// Tabela zaduženja; na stranici zaposlenog bez kolone „Zaposleni“.
export function IssueTable({ issues, canEdit, showEmployee }: { issues: Issue[]; canEdit: boolean; showEmployee: boolean }) {
  const head = [
    "Zaduženo",
    ...(showEmployee ? ["Zaposleni"] : []),
    "Oprema",
    "Vel.",
    "Kol.",
    "Zameniti do",
    "",
  ];
  return (
    <Table head={head}>
      {issues.map((i) => {
        const employee = one(i.employee);
        const status = replaceStatus(i);
        return (
          <tr key={i.id} className={i.returned_on ? "bg-gray-50" : ""}>
            <td className="px-2 py-2">{formatDate(i.issued_on)}</td>
            {showEmployee && (
              <td className="px-2 py-2">
                {employee && (
                  <Link href={`/zaposleni/${employee.id}`} className="text-blue-700 hover:underline">
                    {fullName(employee)}
                  </Link>
                )}
              </td>
            )}
            <td className="px-2 py-2">{one(i.ppe_item)?.name}</td>
            <td className="px-2 py-2 text-gray-600">{i.size ?? "—"}</td>
            <td className="px-2 py-2">{i.quantity}</td>
            <td className={`px-2 py-2 ${status.className}`}>{status.label}</td>
            <td className="px-2 py-2 text-right whitespace-nowrap">
              {canEdit && (
                <div className="flex justify-end gap-3">
                  {!i.returned_on && (
                    <form action={returnPpe.bind(null, i.id)}>
                      <ConfirmButton message="Razdužiti ovu opremu danas?" className={`${linkButton} text-blue-700`}>
                        Razduži
                      </ConfirmButton>
                    </form>
                  )}
                  <form action={deleteIssue.bind(null, i.id)}>
                    <ConfirmButton message="Obrisati ovo zaduženje?" className={`${linkButton} text-red-700`}>
                      Obriši
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </td>
          </tr>
        );
      })}
    </Table>
  );
}
