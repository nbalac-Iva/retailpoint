-- LZO: artikli lične zaštitne opreme, normativ po radnom mestu, zaduženja i razduženja.
-- Pokreće se jednom, u Supabase -> SQL Editor, posle 0001_init.sql.

create table ppe_item (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null,
  standard text, -- npr. EN 397
  replacement_months int check (replacement_months > 0), -- podrazumevani rok zamene
  created_at timestamptz not null default now()
);

-- Normativ: šta radno mesto mora da ima i koliko često se menja.
create table ppe_norm (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  job_position_id uuid not null references job_position(id) on delete cascade,
  ppe_item_id uuid not null references ppe_item(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  replacement_months int check (replacement_months > 0), -- NULL = rok sa artikla
  unique (job_position_id, ppe_item_id)
);

-- Jedan red = jedno zaduženje; razduženje upisuje returned_on.
create table ppe_issue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  employee_id uuid not null references employee(id) on delete cascade,
  ppe_item_id uuid not null references ppe_item(id) on delete cascade,
  size text,
  quantity int not null default 1 check (quantity > 0),
  issued_on date not null,
  replace_by date, -- NULL = bez roka zamene
  returned_on date,
  note text,
  created_at timestamptz not null default now()
);

create index on ppe_issue (employee_id, ppe_item_id);

alter table ppe_item enable row level security;
alter table ppe_norm enable row level security;
alter table ppe_issue enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['ppe_item', 'ppe_norm', 'ppe_issue'] loop
    execute format('create policy "citanje" on %I for select using (is_member(company_id))', t);
    execute format('create policy "unos" on %I for insert with check (can_edit(company_id))', t);
    execute format('create policy "izmena" on %I for update using (can_edit(company_id)) with check (can_edit(company_id))', t);
    execute format('create policy "brisanje" on %I for delete using (can_edit(company_id))', t);
  end loop;
end $$;

grant select, insert, update, delete on ppe_item, ppe_norm, ppe_issue to authenticated;

-- Usklađenost sada pokriva i LZO: važi ono zaduženje koje nije razduženo.
create or replace view compliance_status with (security_invoker = true) as
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
  union all
  select e.id, e.company_id, e.first_name, e.last_name,
         'ppe', n.ppe_item_id, pi.name
  from employee e
  join ppe_norm n on n.job_position_id = e.job_position_id
  join ppe_item pi on pi.id = n.ppe_item_id
  where e.status = 'active'
),
latest as (
  select req.*,
    case req.requirement_type
      when 'exam' then (
        select max(coalesce(m.valid_until, 'infinity'::date)) from medical_exam m
        where m.employee_id = req.employee_id and m.exam_type_id = req.requirement_id
          and m.result <> 'nesposoban')
      when 'training' then (
        select max(coalesce(t.valid_until, 'infinity'::date)) from training_record t
        where t.employee_id = req.employee_id and t.training_program_id = req.requirement_id
          and t.passed)
      else (
        select max(coalesce(i.replace_by, 'infinity'::date)) from ppe_issue i
        where i.employee_id = req.employee_id and i.ppe_item_id = req.requirement_id
          and i.returned_on is null)
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

grant select on compliance_status to authenticated;

-- Neprijavljeni posetioci (anon) ne treba da vide nijednu tabelu.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
