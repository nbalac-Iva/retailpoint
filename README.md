# RetailPoint BZR

Web aplikacija za evidencije bezbednosti i zdravlja na radu: radna mesta sa obaveznim pregledima i obukama, zaposleni, lekarski pregledi, obuke i pregled usklađenosti.

- **Ekran:** React (Next.js 16), Tailwind
- **Baza, prijava, pravila pristupa:** Supabase (PostgreSQL sa Row Level Security)
- **Objava:** Vercel, automatski posle svakog slanja na GitHub

## Prvo pokretanje

1. **Supabase projekat.** Na [supabase.com](https://supabase.com) napravite projekat (region: Frankfurt, `eu-central-1`).
2. **Šema baze.** U Supabase otvorite **SQL Editor**, nalepite ceo sadržaj fajla [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) i kliknite **Run**.
3. **Ključevi.** *Project URL* i *Publishable key* (Supabase -> **Project Settings -> API Keys**) upisani su u [`src/lib/supabase/config.ts`](src/lib/supabase/config.ts). Oba su javna; tajni ključ (`sb_secret_…`) nikad ne ide u kod.
4. **Adrese za prijavu.** U Supabase -> **Authentication -> URL Configuration** dodajte u *Redirect URLs*:
   - `http://localhost:3000/**`
   - adresu sa Vercel-a, `https://retailpoint.vercel.app/**`
5. **Pokretanje na računaru:**

   ```bash
   npm install
   npm run dev
   ```

   Otvorite <http://localhost:3000>, registrujte se i unesite firmu.

## Objava na Vercel

1. Pošaljite kod na GitHub (`git push`).
2. Na [vercel.com/new](https://vercel.com/new) uvezite repozitorijum. Promenljive okruženja nisu potrebne.
3. Posle toga svaki `git push` sam objavljuje novu verziju.

## Struktura

| Putanja | Šta je |
| --- | --- |
| `supabase/migrations/` | SQL šema, pravila pristupa (RLS), view `compliance_status` |
| `src/proxy.ts` | Osvežava sesiju i šalje neprijavljene na `/login` |
| `src/lib/context.ts` | Prijavljeni korisnik, njegova firma i uloga |
| `src/app/(app)/` | Stranice aplikacije: pregled, zaposleni, radna mesta, pregledi, obuke |
| `src/components/` | Forme i zajednički delovi ekrana |

## Uloge

- **admin** i **bzr**: vide i menjaju sve, uključujući lekarske preglede.
- **pregled**: samo čita, bez zdravstvenih podataka.

Prvi korisnik firme dobija ulogu admin.
