-- STARLING visitors — one row per player. Re-run is safe.

alter table public.visits add column if not exists country text;
alter table public.visits add column if not exists source text;
alter table public.visits add column if not exists referrer text;
alter table public.visits add column if not exists lang text;

create table if not exists public.visitors (
  visitor_id text primary key,
  country text,
  source text,
  referrer text,
  device text,
  lang text,
  visit_count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.visitors add column if not exists play_seconds bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'visitors' and column_name = 'play_hours'
  ) then
    alter table public.visitors
      add column play_hours numeric generated always as (round(play_seconds / 3600.0, 2)) stored;
  end if;
end $$;

create index if not exists visitors_last_seen_idx on public.visitors (last_seen desc);

alter table public.visitors enable row level security;

drop trigger if exists visits_bump_visitor on public.visits;

create or replace function public.register_visitor(
  p_visitor_id text,
  p_device text default 'desktop',
  p_country text default '',
  p_source text default '',
  p_referrer text default '',
  p_lang text default ''
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
  v_device text;
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 80 then
    return json_build_object('ok', false, 'first_time', false);
  end if;
  v_device := case when p_device = 'mobile' then 'mobile' else 'desktop' end;
  insert into public.visitors (
    visitor_id, country, source, referrer, device, lang, visit_count, play_seconds, first_seen, last_seen
  ) values (
    p_visitor_id,
    nullif(left(trim(coalesce(p_country, '')), 80), ''),
    nullif(left(trim(coalesce(p_source, '')), 80), ''),
    nullif(left(trim(coalesce(p_referrer, '')), 300), ''),
    v_device,
    nullif(left(trim(coalesce(p_lang, '')), 8), ''),
    1,
    0,
    now(),
    now()
  )
  on conflict (visitor_id) do nothing;
  get diagnostics n = row_count;
  return json_build_object('ok', true, 'first_time', n > 0);
end;
$$;

create or replace function public.add_play_seconds(p_visitor_id text, p_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sec int;
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 80 then
    return;
  end if;
  sec := coalesce(p_seconds, 0);
  if sec < 1 then
    return;
  end if;
  if sec > 60 then
    sec := 60;
  end if;
  update public.visitors
  set play_seconds = play_seconds + sec,
      last_seen = now()
  where visitor_id = p_visitor_id;
end;
$$;

grant usage on schema public to anon, authenticated;
grant execute on function public.register_visitor(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.add_play_seconds(text, integer) to anon, authenticated;

create or replace view public.playtime_totals as
select
  count(*)::int as unique_players,
  coalesce(sum(play_seconds), 0)::bigint as play_seconds,
  round(coalesce(sum(play_seconds), 0) / 3600.0, 2) as play_hours
from public.visitors;

drop view if exists public.visits_by_country;

create or replace view public.visits_by_country as
select
  coalesce(nullif(country, ''), 'unknown') as country,
  count(*)::int as unique_people,
  round(coalesce(sum(play_seconds), 0) / 3600.0, 2) as play_hours
from public.visitors
group by 1
order by unique_people desc;

notify pgrst, 'reload schema';
