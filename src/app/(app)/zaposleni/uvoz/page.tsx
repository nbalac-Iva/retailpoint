import Link from "next/link";
import { Card, Empty, PageHeader } from "@/components/ui";
import { getContext } from "@/lib/context";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const { canEdit } = await getContext();

  return (
    <>
      <PageHeader title="Uvoz zaposlenih iz Excela">
        <Link href="/zaposleni" className="text-sm text-blue-700 hover:underline">
          ← Svi zaposleni
        </Link>
      </PageHeader>
      <Card>
        {canEdit ? (
          <>
            <p className="mb-6 text-sm text-gray-600">
              Kolone koje prepoznajem: <strong>Ime</strong>, <strong>Prezime</strong> (ili <strong>Ime i prezime</strong>
              ), <strong>Radno mesto</strong> i <strong>Zaposlen od</strong>. Ako se naslovi razlikuju, kolone birate
              ručno posle učitavanja. Ništa se ne upisuje pre klika na „Uvezi“.{" "}
              <a href="/primer-zaposleni.xlsx" download className="text-blue-700 hover:underline">
                Preuzmite primer fajla
              </a>
              .
            </p>
            <ImportForm />
          </>
        ) : (
          <Empty>Uvoz mogu da rade samo administrator i lice za BZR.</Empty>
        )}
      </Card>
    </>
  );
}
