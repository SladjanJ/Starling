-- STARLING visits — run in the Game project SQL editor (Table Editor you already use).
-- Adds country/source columns, plus visitors (one row per person with visit_count).

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

create index if not exists visitors_last_seen_idx on public.visitors (last_seen desc);

alter table public.visitors enable row level security;

create or replace function public.bump_visitor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visitors (
    visitor_id, country, source, referrer, device, lang, visit_count, first_seen, last_seen
  ) values (
    new.visitor_id, new.country, new.source, new.referrer, new.device, new.lang, 1, now(), now()
  )
  on conflict (visitor_id) do update set
    visit_count = visitors.visit_count + 1,
    last_seen = now(),
    device = excluded.device,
    country = coalesce(visitors.country, excluded.country),
    source = coalesce(visitors.source, excluded.source),
    referrer = coalesce(visitors.referrer, excluded.referrer),
    lang = coalesce(visitors.lang, excluded.lang);
  return new;
end;
$$;

drop trigger if exists visits_bump_visitor on public.visits;
create trigger visits_bump_visitor
after insert on public.visits
for each row execute procedure public.bump_visitor();

insert into public.visitors (visitor_id, device, visit_count, first_seen, last_seen)
select
  visitor_id,
  (array_agg(device order by created_at desc))[1],
  count(*)::int,
  min(created_at),
  max(created_at)
from public.visits
group by visitor_id
on conflict (visitor_id) do nothing;
