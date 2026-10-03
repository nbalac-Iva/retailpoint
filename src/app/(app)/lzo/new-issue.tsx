"use client";

import { useRef, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { PpeIssueFields } from "@/components/forms";
import { formGrid } from "@/components/ui";
import { issuePpe } from "./actions";

type Option = { id: string; name: string };
type EmployeeOption = { id: string; first_name: string; last_name: string };

// Dugme „Novo“ u zaglavlju liste otvara formu za zaduženje u iskačućem prozoru.
export function NewIssue({
  items,
  employees,
  toolbar,
}: {
  items: Option[];
  employees: EmployeeOption[];
  toolbar: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Novi ključ pri svakom otvaranju: prazna forma i bez stare poruke o grešci.
  const [formKey, setFormKey] = useState(0);

  function open() {
    setFormKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">{toolbar}</div>
        <button
          onClick={open}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          + Novo
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="new-issue-title"
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg bg-white p-0 shadow-xl backdrop:bg-black/40"
        onClick={(event) => {
          // Klik na zatamnjenu pozadinu (van sadržaja) zatvara prozor.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="new-issue-title" className="text-lg font-semibold text-gray-900">
              Novo zaduženje
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Zatvori"
              className="rounded-md px-2 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              ×
            </button>
          </div>
          <ActionForm
            key={formKey}
            action={issuePpe}
            submitLabel="Zaduži"
            className={formGrid}
            onSuccess={close}
            extraButtons={
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                Otkaži
              </button>
            }
          >
            <PpeIssueFields items={items} employees={employees} />
          </ActionForm>
        </div>
      </dialog>
    </>
  );
}
