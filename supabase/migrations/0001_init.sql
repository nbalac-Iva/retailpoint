-- Zentra MVP: firme, korisnici, radna mesta, zaposleni, lekarski pregledi, obuke.
-- Pokreće se jednom, u Supabase -> SQL Editor.

-- =========================================================
-- Tenancy i pristup
-- =========================================================

create table tenant (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'company' check (type in ('agency', 'company')),
  created_at timestamptz not null default now()
);

create table company (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name text not null,
  pib text,
  maticni_broj text,
  address text,
  created_at timestamptz not null default now()
);

-- Uloga korisnika po firmi: admin i bzr menjaju podatke, pregled samo čita.
create table membership (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references company(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'bzr', 'pregled')),
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

-- security definer: čita membership bez RLS-a, pa politike ne ulaze u rekurziju.
create function is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membership where company_id = cid and user_id = auth.uid()
  );
$$;

create function can_edit(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from membership
    where company_id = cid and user_id = auth.uid() and role in ('admin', 'bzr')
  );
$$;

-- Prva firma novog korisnika: pravi tenant, firmu i admin članstvo u jednom koraku.
create function create_company(p_name text, p_pib text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t uuid;
  c uuid;
begin
  if auth.uid() is null then
    raise exception 'Niste prijavljeni';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Naziv firme je obavezan';
  end if;
  insert into tenant (name, type) values (trim(p_name), 'company') returning id into t;
  insert into company (tenant_id, name, pib)
    values (t, trim(p_name), nullif(trim(p_pib), '')) returning id into c;
  insert into membership (user_id, company_id, role) values (auth.uid(), c, 'admin');
  return c;
end;
$$;

-- =========================================================
-- Radna mesta i zaposleni
-- =========================================================

create table job_position (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null,
  code text,
  is_high_risk boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create table employee (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  job_position_id uuid references job_position(id) on delete set null,
  employed_from date,
  status text not null default 'active' check (status in ('active', 'leave', 'terminated')),
  note text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Lekarski pregledi
-- =========================================================

-- company_id NULL = sistemski tip, vidljiv svima.
create table exam_type (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

insert into exam_type (name) values
  ('Prethodni lekarski pregled'),
  ('Periodični lekarski pregled'),
  ('Vanredni lekarski pregled');

create table position_exam_req (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  job_position_id uuid not null references job_position(id) on delete cascade,
  exam_type_id uuid not null references exam_type(id) on delete cascade,
  interval_months int check (interval_months > 0),
  unique (job_position_id, exam_type_id)
);

create table medical_exam (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  employee_id uuid not null references employee(id) on delete cascade,
  exam_type_id uuid not null references exam_type(id),
  exam_date date not null,
  result text not null check (result in ('sposoban', 'sposoban_sa_ogranicenjem', 'nesposoban')),
  restrictions text,
  valid_until date, -- NULL = bez roka
  institution text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Obuke (osposobljavanje)
-- =========================================================

create table training_program (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null,
  is_statutory boolean not null default true,
  validity_months int check (validity_months > 0), -- NULL = bez roka
  created_at timestamptz not null default now()
);

create table position_training_req (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  job_position_id uuid not null references job_position(id) on delete cascade,
  training_program_id uuid not null references training_program(id) on delete cascade,
  unique (job_position_id, training_program_id)
);

create table training_record (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  employee_id uuid not null references employee(id) on delete cascade,
  training_program_id uuid not null references training_program(id) on delete cascade,
  held_on date not null,
  reason text check (reason in ('prijem', 'premestaj', 'nova_oprema', 'periodicno', 'ostalo')),
  trainer text,
  passed boolean not null default true,
  valid_until date, -- NULL = bez roka
  created_at timestamptz not null default now()
);

create index on employee (company_id);
create index on medical_exam (employee_id, exam_type_id);
create index on training_record (employee_id, training_program_id);

-- =========================================================
-- Usklađenost: zahtevi radnog mesta naspram važećih zapisa
-- =========================================================

-- security_invoker: view poštuje RLS korisnika koji ga čita.
create view compliance_status with (security_invoker = true) as
with req as (
  select e.id as employee_id, e.company_id, e.first_name, e.last_name,
         'exam'::text as requirement_type, r.exam_type_id as requirement_id,
         et.name as requirement_name
  from employee e
  join position_exam_req r on r.job_position_id = e.job_position_id
  join exam_type et on et.id = r.exam_type_id
  where e.status = 'active'
  union all
  select e.id, e.company_id, e.first_name, e.last_name,
         'training', r.training_program_id, tp.name
  from employee e
  join position_training_req r on r.job_position_id = e.job_position_id
  join training_program tp on tp.id = r.training_program_id
  where e.status = 'active'
),
latest as (
  select req.*,
    case req.requirement_type
      when 'exam' then (
        select max(coalesce(m.valid_until, 'infinity'::date)) from medical_exam m
        where m.employee_id = req.employee_id and m.exam_type_id = req.requirement_id
          and m.result <> 'nesposoban')
      else (
        select max(coalesce(t.valid_until, 'infinity'::date)) from training_record t
        where t.employee_id = req.employee_id and t.training_program_id = req.requirement_id
          and t.passed)
    end as valid_until
  from req
)
select latest.*,
  case
    when valid_until is null then 'missing'
    when valid_until < current_date then 'expired'
    when valid_until < current_date + 30 then 'expiring'
    else 'ok'
  end as status
from latest;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table tenant enable row level security;
alter table company enable row level security;
alter table membership enable row level security;
alter table job_position enable row level security;
alter table employee enable row level security;
alter table exam_type enable row level security;
alter table position_exam_req enable row level security;
alter table medical_exam enable row level security;
alter table training_program enable row level security;
alter table position_training_req enable row level security;
alter table training_record enable row level security;

create policy "svoja clanstva" on membership for select using (user_id = auth.uid());

create policy "citanje" on tenant for select using (
  exists (select 1 from company c where c.tenant_id = tenant.id and is_member(c.id))
);

create policy "citanje" on company for select using (is_member(id));
create policy "izmena" on company for update using (can_edit(id)) with check (can_edit(id));

create policy "citanje" on exam_type for select
  using (company_id is null or is_member(company_id));
create policy "unos" on exam_type for insert with check (can_edit(company_id));
create policy "izmena" on exam_type for update using (can_edit(company_id)) with check (can_edit(company_id));
create policy "brisanje" on exam_type for delete using (can_edit(company_id));

-- Ista četiri pravila za sve tabele koje nose company_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'job_position', 'employee', 'position_exam_req',
    'training_program', 'position_training_req', 'training_record'
  ] loop
    execute format('create policy "citanje" on %I for select using (is_member(company_id))', t);
    execute format('create policy "unos" on %I for insert with check (can_edit(company_id))', t);
    execute format('create policy "izmena" on %I for update using (can_edit(company_id)) with check (can_edit(company_id))', t);
    execute format('create policy "brisanje" on %I for delete using (can_edit(company_id))', t);
  end loop;
end $$;

-- Zdravstveni podaci: vide ih samo admin i bzr, ne uloga pregled.
create policy "citanje" on medical_exam for select using (can_edit(company_id));
create policy "unos" on medical_exam for insert with check (can_edit(company_id));
create policy "izmena" on medical_exam for update using (can_edit(company_id)) with check (can_edit(company_id));
create policy "brisanje" on medical_exam for delete using (can_edit(company_id));

-- =========================================================
-- Prava za Data API (prijavljeni korisnici; RLS i dalje važi)
-- =========================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on compliance_status to authenticated;
revoke all on function create_company(text, text) from public, anon;
grant execute on function create_company(text, text) to authenticated;
grant execute on function is_member(uuid) to authenticated;
grant execute on function can_edit(uuid) to authenticated;
