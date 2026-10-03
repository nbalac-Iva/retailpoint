import { Field, inputClass } from "@/components/ui";

type Position = {
  name: string;
  code: string | null;
  is_high_risk: boolean;
  description: string | null;
};

// Polja zajednička za unos i izmenu radnog mesta.
export function PositionFields({ position }: { position?: Position }) {
  return (
    <>
      <Field label="Naziv">
        <input name="name" required defaultValue={position?.name} className={inputClass} />
      </Field>
      <Field label="Šifra (nije obavezno)">
        <input name="code" defaultValue={position?.code ?? ""} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
        <input name="is_high_risk" type="checkbox" defaultChecked={position?.is_high_risk} />
        Radno mesto sa povećanim rizikom
      </label>
      <Field label="Opis poslova (nije obavezno)" wide>
        <textarea name="description" rows={2} defaultValue={position?.description ?? ""} className={inputClass} />
      </Field>
    </>
  );
}
