-- Help-email for people who started signing up but never finished.
-- One row per email actually sent (day1, day5) or an opt-out. unique(user_id, kind) makes every send once-only.
create table public.signup_nudges (
  id integer generated always as identity primary key,
  user_id uuid not null,
  kind text not null check (kind in ('day1', 'day5', 'optout')),
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);
alter table public.signup_nudges enable row level security; -- server-only: no policies on purpose
revoke all on public.signup_nudges from anon, authenticated;

-- Who is due a nudge: confirmed account, no Channel yet or a Channel still in draft, quiet for 24h (day1) or 5 days (day5),
-- never opted out, never already sent this kind, and not the founder. Stops after 30 days of silence.
create or replace function public.signup_nudge_candidates(p_kind text, p_admin_email text)
returns table (user_id uuid, email text, channel_name text, has_channel boolean, has_logo boolean, has_phone boolean, has_services boolean, has_video boolean)
language sql stable security definer set search_path = public, auth as $$
  select distinct on (u.id)
    u.id, u.email::text, c.name, c.id is not null,
    c.logo_url is not null, c.phone is not null,
    coalesce(array_length(c.services, 1), 0) > 0,
    (c.video_url is not null or c.video_file_url is not null)
  from auth.users u
  left join public.channels c on c.owner_id = u.id
  where p_kind in ('day1', 'day5')
    and u.email_confirmed_at is not null
    and u.email is not null and lower(u.email) <> lower(p_admin_email)
    and (c.id is null or c.status = 'draft')
    and coalesce(c.updated_at, u.created_at) < now() - (case p_kind when 'day1' then interval '24 hours' else interval '5 days' end)
    and coalesce(c.updated_at, u.created_at) > now() - interval '30 days'
    and not exists (select 1 from public.signup_nudges n where n.user_id = u.id and n.kind in (p_kind, 'optout'))
    and (p_kind = 'day1' or exists (
      select 1 from public.signup_nudges n where n.user_id = u.id and n.kind = 'day1' and n.created_at < now() - interval '3 days'))
  order by u.id, c.updated_at desc nulls last;
$$;
revoke execute on function public.signup_nudge_candidates(text, text) from public, anon, authenticated;
