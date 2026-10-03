"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { PpeIssueFields } from "@/components/forms";
import { formGrid } from "@/components/ui";
import { issuePpe } from "./actions";

type Option = { id: string; name: string };
type EmployeeOption = { id: string; first_name: string; last_name: string };

// Dugme „Novo“ u zaglavlju liste; forma za zaduženje se otvara tek na klik.
export function NewIssue({
  items,
  employees,
  toolbar,
}: {
  items: Option[];
  employees: EmployeeOption[];
  toolbar: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">{toolbar}</div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            + Novo
          </button>
        )}
      </div>
      {open && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Novo zaduženje</h3>
          <ActionForm
            action={issuePpe}
            submitLabel="Zaduži"
            className={formGrid}
            onSuccess={() => setOpen(false)}
            extraButtons={
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                Otkaži
              </button>
            }
          >
            <PpeIssueFields items={items} employees={employees} />
          </ActionForm>
        </div>
      )}
    </>
  );
}
