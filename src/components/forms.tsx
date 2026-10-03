import { Field, inputClass } from "@/components/ui";
import { EMPLOYEE_STATUS_LABEL, EXAM_RESULT_LABEL, fullName, TRAINING_REASON_LABEL } from "@/lib/format";

type Option = { id: string; name: string };
type EmployeeOption = { id: string; first_name: string; last_name: string };

// Kad je zaposleni već poznat (stranica zaposlenog), šalje se kao skriveno polje.
function EmployeePicker({ employees, employeeId }: { employees?: EmployeeOption[]; employeeId?: string }) {
  if (employeeId) return <input type="hidden" name="employee_id" value={employeeId} />;
  return (
    <Field label="Zaposleni">
      <select name="employee_id" required className={inputClass}>
        <option value="">Izaberite…</option>
        {employees?.map((e) => (
          <option key={e.id} value={e.id}>
            {fullName(e)}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function EmployeeFields({
  positions,
  employee,
}: {
  positions: Option[];
  employee?: {
    first_name: string;
    last_name: string;
    job_position_id: string | null;
    employed_from: string | null;
    status: string;
    note: string | null;
  };
}) {
  return (
    <>
      <Field label="Ime">
        <input name="first_name" required defaultValue={employee?.first_name} className={inputClass} />
      </Field>
      <Field label="Prezime">
        <input name="last_name" required defaultValue={employee?.last_name} className={inputClass} />
      </Field>
      <Field label="Radno mesto">
        <select name="job_position_id" defaultValue={employee?.job_position_id ?? ""} className={inputClass}>
          <option value="">— nije raspoređen —</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Zaposlen od">
        <input name="employed_from" type="date" defaultValue={employee?.employed_from ?? ""} className={inputClass} />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={employee?.status ?? "active"} className={inputClass}>
          {Object.entries(EMPLOYEE_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Napomena" wide>
        <textarea name="note" rows={2} defaultValue={employee?.note ?? ""} className={inputClass} />
      </Field>
    </>
  );
}

export function ExamFields({
  examTypes,
  employees,
  employeeId,
}: {
  examTypes: Option[];
  employees?: EmployeeOption[];
  employeeId?: string;
}) {
  return (
    <>
      <EmployeePicker employees={employees} employeeId={employeeId} />
      <Field label="Vrsta pregleda">
        <select name="exam_type_id" required className={inputClass}>
          <option value="">Izaberite…</option>
          {examTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Datum pregleda">
        <input name="exam_date" type="date" required className={inputClass} />
      </Field>
      <Field label="Nalaz">
        <select name="result" required className={inputClass}>
          {Object.entries(EXAM_RESULT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Važi do (prazno = po radnom mestu)">
        <input name="valid_until" type="date" className={inputClass} />
      </Field>
      <Field label="Zdravstvena ustanova">
        <input name="institution" className={inputClass} />
      </Field>
      <Field label="Ograničenja" wide>
        <textarea name="restrictions" rows={2} className={inputClass} />
      </Field>
    </>
  );
}

export function PpeIssueFields({
  items,
  employees,
  employeeId,
}: {
  items: Option[];
  employees?: EmployeeOption[];
  employeeId?: string;
}) {
  return (
    <>
      <EmployeePicker employees={employees} employeeId={employeeId} />
      <Field label="Oprema">
        <select name="ppe_item_id" required className={inputClass}>
          <option value="">Izaberite…</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Datum zaduženja">
        <input name="issued_on" type="date" required className={inputClass} />
      </Field>
      <Field label="Veličina">
        <input name="size" placeholder="npr. 42, L" className={inputClass} />
      </Field>
      <Field label="Količina">
        <input name="quantity" type="number" min={1} defaultValue={1} className={inputClass} />
      </Field>
      <Field label="Zameniti do (prazno = po normativu)">
        <input name="replace_by" type="date" className={inputClass} />
      </Field>
      <Field label="Napomena" wide>
        <input name="note" className={inputClass} />
      </Field>
    </>
  );
}

export function TrainingFields({
  programs,
  employees,
  employeeId,
}: {
  programs: Option[];
  employees?: EmployeeOption[];
  employeeId?: string;
}) {
  return (
    <>
      <EmployeePicker employees={employees} employeeId={employeeId} />
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
      <Field label="Datum obuke">
        <input name="held_on" type="date" required className={inputClass} />
      </Field>
      <Field label="Povod">
        <select name="reason" className={inputClass}>
          <option value="">—</option>
          {Object.entries(TRAINING_REASON_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sproveo">
        <input name="trainer" className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
        <input name="passed" type="checkbox" defaultChecked />
        Položio proveru
      </label>
    </>
  );
}
