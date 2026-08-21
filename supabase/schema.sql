-- STARLING visit counter — run this in the NEW project SQL editor
-- Project: https://dmxlmoncttcfuphjeuqi.supabase.co
-- Do not run this on any other Supabase project.
-- Before running: replace CHANGE_ME with your admin PIN.

create extension if not exists pgcrypto;

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  device text not null check (device in ('mobile', 'desktop')),
  created_at timestamptz not null default now()
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);
create index if not exists visits_visitor_id_idx on public.visits (visitor_id);

alter table public.visits enable row level security;

drop policy if exists anon_insert_visits on public.visits;
create policy anon_insert_visits
  on public.visits
  for insert
  to anon, authenticated
  with check (true);

create table if not exists public.admin_settings (
  id int primary key check (id = 1),
  pin_hash text not null
);

alter table public.admin_settings enable row level security;

insert into public.admin_settings (id, pin_hash)
values (1, crypt('CHANGE_ME', gen_salt('bf')))
on conflict (id) do update set pin_hash = excluded.pin_hash;

create or replace function public.track_visit(p_visitor_id text, p_device text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 80 then
    return;
  end if;
  if p_device not in ('mobile', 'desktop') then
    p_device := 'desktop';
  end if;
  insert into public.visits (visitor_id, device) values (p_visitor_id, p_device);
end;
$$;

create or replace function public.get_visit_stats(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select pin_hash = crypt(p_pin, pin_hash) into ok from public.admin_settings where id = 1;
  if not coalesce(ok, false) then
    return json_build_object('ok', false, 'error', 'unauthorized');
  end if;
  return json_build_object(
    'ok', true,
    'total', (select count(*)::int from public.visits),
    'unique', (select count(distinct visitor_id)::int from public.visits),
    'last_7_days', (select count(*)::int from public.visits where created_at > now() - interval '7 days'),
    'mobile', (select count(*)::int from public.visits where device = 'mobile'),
    'desktop', (select count(*)::int from public.visits where device = 'desktop')
  );
end;
$$;

grant usage on schema public to anon, authenticated;
revoke all on public.visits from anon, authenticated;
grant insert on public.visits to anon, authenticated;
grant execute on function public.track_visit(text, text) to anon, authenticated;
grant execute on function public.get_visit_stats(text) to anon, authenticated;

notify pgrst, 'reload schema';
