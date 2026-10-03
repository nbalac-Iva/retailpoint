"use client";

import Link from "next/link";
import { readSheet } from "read-excel-file/browser";
import { useState, useTransition } from "react";
import { Field, inputClass, Table } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { importEmployees, type ImportResult, type ImportRow } from "./actions";

type Mapping = { full: number; first: number; last: number; position: number; employed: number };
const NONE = -1;

// Naslovi kolona bez dijakritika i velikih slova, da „Ime i prezime“ = „ime i prezime“.
function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "dj")
    .replace(/\s+/g, " ")
    .trim();
}

function guessMapping(header: string[]): Mapping {
  const find = (...names: string[]) => header.findIndex((h) => names.includes(h));
  return {
    full: find("ime i prezime", "prezime i ime", "zaposleni", "radnik", "ime prezime"),
    first: find("ime"),
    last: find("prezime"),
    position: find("radno mesto", "radno mjesto", "pozicija", "naziv radnog mesta", "radno mesto naziv"),
    employed: find("zaposlen od", "datum zaposlenja", "datum zaposljavanja", "pocetak rada", "datum prijema"),
  };
}

// Excel datum stiže kao Date, broj (serijski dan) ili tekst „31.12.2024.“.
function toIsoDate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && value > 20000 && value < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  const sr = text.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/);
  if (sr) return `${sr[3]}-${sr[2].padStart(2, "0")}-${sr[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return null;
}

function cell(row: unknown[], index: number): string {
  return index === NONE ? "" : String(row[index] ?? "").trim();
}

function toImportRows(rows: unknown[][], m: Mapping, reversedFullName: boolean): ImportRow[] {
  return rows
    .map((row) => {
      let first = cell(row, m.first);
      let last = cell(row, m.last);
      if (m.full !== NONE && (!first || !last)) {
        // „Petar Petrović“ → ime Petar, prezime Petrović (ili obrnuto za „prezime i ime“).
        const parts = cell(row, m.full).split(/\s+/).filter(Boolean);
        if (reversedFullName) {
          last = parts[0] ?? "";
          first = parts.slice(1).join(" ");
        } else {
          first = parts[0] ?? "";
          last = parts.slice(1).join(" ");
        }
      }
      return {
        first_name: first,
        last_name: last,
        position: cell(row, m.position) || null,
        employed_from: m.employed === NONE ? null : toIsoDate(row[m.employed]),
      };
    })
    .filter((r) => r.first_name || r.last_name);
}

export function ImportForm() {
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({ full: NONE, first: NONE, last: NONE, position: NONE, employed: NONE });
  const [createPositions, setCreatePositions] = useState(true);
  const [fileError, setFileError] = useState<string>();
  const [result, setResult] = useState<ImportResult>();
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setFileError(undefined);
    setResult(undefined);
    setRows([]);
    if (!file) return;
    try {
      const data = (await readSheet(file)) as unknown[][];
      const nonEmpty = data.filter((r) => r.some((c) => c !== null && String(c).trim() !== ""));
      if (nonEmpty.length < 2) {
        setFileError("Fajl nema podatke ispod reda sa naslovima kolona.");
        return;
      }
      const titles = nonEmpty[0].map((c, i) => String(c ?? "").trim() || `Kolona ${i + 1}`);
      setHeader(titles);
      setRows(nonEmpty.slice(1));
      setMapping(guessMapping(titles.map(normalize)));
    } catch {
      setFileError("Ne mogu da pročitam fajl. Sačuvajte ga kao .xlsx (Excel radna sveska) i pokušajte ponovo.");
    }
  }

  const reversed = mapping.full !== NONE && normalize(header[mapping.full]) === "prezime i ime";
  const parsed = toImportRows(rows, mapping, reversed);
  const hasNames = mapping.full !== NONE || (mapping.first !== NONE && mapping.last !== NONE);

  function submit() {
    startTransition(async () => {
      setResult(await importEmployees(parsed, createPositions));
    });
  }

  const columnSelect = (field: keyof Mapping, label: string) => (
    <Field label={label}>
      <select
        value={mapping[field]}
        onChange={(e) => setMapping({ ...mapping, [field]: Number(e.target.value) })}
        className={inputClass}
      >
        <option value={NONE}>— nema —</option>
        {header.map((h, i) => (
          <option key={i} value={i}>
            {h}
          </option>
        ))}
      </select>
    </Field>
  );

  if (result?.created !== undefined) {
    return (
      <div className="space-y-3 text-sm">
        <p className="rounded-md bg-green-50 p-3 text-green-900">
          Uvezeno zaposlenih: <strong>{result.created}</strong>
          {!!result.positionsCreated && <>, novih radnih mesta: <strong>{result.positionsCreated}</strong></>}
          {!!result.skipped && <>. Preskočeno (već postoje ili bez imena): {result.skipped}</>}.
        </p>
        <Link href="/zaposleni" className="text-blue-700 hover:underline">
          Idi na zaposlene →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Field label="Excel fajl (.xlsx), prvi red su naslovi kolona">
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="text-sm"
        />
      </Field>
      {fileError && <p className="text-sm text-red-700">{fileError}</p>}

      {rows.length > 0 && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Koja kolona je šta</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {columnSelect("full", "Ime i prezime (u jednoj koloni)")}
              {columnSelect("first", "Ime")}
              {columnSelect("last", "Prezime")}
              {columnSelect("position", "Radno mesto")}
              {columnSelect("employed", "Zaposlen od")}
            </div>
            {!hasNames && (
              <p className="mt-3 text-sm text-red-700">
                Izaberite kolonu „Ime i prezime“, ili obe kolone „Ime“ i „Prezime“.
              </p>
            )}
          </div>

          {hasNames && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Pregled: {parsed.length} zaposlenih{parsed.length > 10 && ", prikazano prvih 10"}
              </h3>
              <Table head={["Ime", "Prezime", "Radno mesto", "Zaposlen od"]}>
                {parsed.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2">{r.first_name || <span className="text-red-700">nedostaje</span>}</td>
                    <td className="px-2 py-2">{r.last_name || <span className="text-red-700">nedostaje</span>}</td>
                    <td className="px-2 py-2">{r.position ?? "—"}</td>
                    <td className="px-2 py-2">{formatDate(r.employed_from)}</td>
                  </tr>
                ))}
              </Table>

              {mapping.position !== NONE && (
                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={createPositions} onChange={(e) => setCreatePositions(e.target.checked)} />
                  Napravi radna mesta koja još ne postoje
                </label>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={submit}
                  disabled={pending || parsed.length === 0}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {pending ? "Uvozim…" : `Uvezi ${parsed.length} zaposlenih`}
                </button>
                {result?.error && <p className="text-sm text-red-700">{result.error}</p>}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Zaposleni sa istim imenom i prezimenom koji već postoje biće preskočeni.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
