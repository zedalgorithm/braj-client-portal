-- Part-timer allowed services mapping
-- Links part-timer users to the services they are allowed to work on.

create table if not exists public.parttimer_allowed_services (
  id uuid primary key default gen_random_uuid(),
  parttimer_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null,
  created_at timestamptz not null default now(),
  unique (parttimer_id, service_type)
);

alter table public.parttimer_allowed_services enable row level security;

drop policy if exists "Admins manage parttimer services" on public.parttimer_allowed_services;
create policy "Admins manage parttimer services"
  on public.parttimer_allowed_services
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Parttimers read own services" on public.parttimer_allowed_services;
create policy "Parttimers read own services"
  on public.parttimer_allowed_services
  for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'parttimer')
    and parttimer_id = auth.uid()
  );

