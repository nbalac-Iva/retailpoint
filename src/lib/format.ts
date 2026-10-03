export type ComplianceStatus = "ok" | "expiring" | "expired" | "missing";

export const STATUS_LABEL: Record<ComplianceStatus, string> = {
  ok: "Važi",
  expiring: "Ističe uskoro",
  expired: "Isteklo",
  missing: "Nedostaje",
};

export const STATUS_CLASS: Record<ComplianceStatus, string> = {
  ok: "bg-green-100 text-green-800",
  expiring: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
  missing: "bg-gray-200 text-gray-800",
};

export const EMPLOYEE_STATUS_LABEL: Record<string, string> = {
  active: "Aktivan",
  leave: "Odsutan",
  terminated: "Ne radi više",
};

export const EXAM_RESULT_LABEL: Record<string, string> = {
  sposoban: "Sposoban",
  sposoban_sa_ogranicenjem: "Sposoban sa ograničenjem",
  nesposoban: "Nesposoban",
};

export const TRAINING_REASON_LABEL: Record<string, string> = {
  prijem: "Prijem na rad",
  premestaj: "Premeštaj",
  nova_oprema: "Nova oprema ili tehnologija",
  periodicno: "Periodična provera",
  ostalo: "Ostalo",
};

// PostgreSQL vraća "infinity" kad zapis nema rok važenja.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  if (value === "infinity") return "bez roka";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}.${m}.${y}.`;
}

// Datum (YYYY-MM-DD) + broj meseci, bez pomeranja zbog vremenske zone.
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

// Veza „više prema jedan“ (npr. pregled → zaposleni) stiže kao objekat, ali je
// bez generisanih tipova baze TypeScript vidi kao niz.
export function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

export function fullName(e: { first_name: string; last_name: string }): string {
  return `${e.first_name} ${e.last_name}`;
}
