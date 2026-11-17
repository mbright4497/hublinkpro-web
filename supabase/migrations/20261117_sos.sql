-- HLP SOS: emergency requests dispatched to on-call Pro pros. First to accept wins; no bidding.
-- Server-only tables: RLS on, no policies (service role only).

alter table public.channels
  add column if not exists on_call boolean not null default false,
  add column if not exists sos_categories text[] not null default '{}',
  add column if not exists sos_fee_ranges jsonb not null default '{}'::jsonb,
  add column if not exists sos_strikes integer not null default 0;

-- Owners may change on_call / categories / fees, never their own strike count.
create or replace function public.guard_channel_sos()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_admin() or auth.role() = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then new.sos_strikes := 0; return new; end if;
  if new.sos_strikes is distinct from old.sos_strikes then
    raise exception 'strikes are managed by HubLinkPro';
  end if;
  return new;
end $$;
drop trigger if exists channels_guard_sos on public.channels;
create trigger channels_guard_sos before insert or update on public.channels
  for each row execute function public.guard_channel_sos();

create table if not exists public.sos_requests (
  id integer generated always as identity primary key,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  market_id integer references public.markets(id),
  zip text not null check (zip ~ '^[0-9]{5}$'),
  category text not null check (category in ('plumbing','roofing','hvac','electrical','water','tree','locksmith','towing')),
  problem text,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  sms_consent boolean not null default false,
  sms_consent_at timestamptz,
  photo_urls text[] not null default '{}',
  status text not null default 'open' check (status in ('open','claimed','arrived','done','expired','cancelled')),
  claimed_channel_id integer references public.channels(id),
  eta_minutes integer check (eta_minutes between 5 and 240),
  ip_hash text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  arrived_at timestamptz,
  done_at timestamptz
);
create index if not exists sos_requests_status_idx on public.sos_requests (status, created_at desc);
create index if not exists sos_requests_ip_idx on public.sos_requests (ip_hash, created_at desc);
alter table public.sos_requests enable row level security;

create table if not exists public.sos_dispatches (
  id integer generated always as identity primary key,
  request_id integer not null references public.sos_requests(id) on delete cascade,
  channel_id integer not null references public.channels(id) on delete cascade,
  wave integer not null default 1,
  method text not null check (method in ('call','sms','app')),
  call_sid text,
  response text not null default 'none' check (response in ('accepted','declined','none')),
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (request_id, channel_id, method)
);
create index if not exists sos_dispatches_call_sid_idx on public.sos_dispatches (call_sid);
alter table public.sos_dispatches enable row level security;

-- Atomic claim: only one caller can ever flip claimed_channel_id from null.
create or replace function public.sos_claim(p_request integer, p_channel integer, p_eta integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.sos_requests
     set claimed_channel_id = p_channel, status = 'claimed', eta_minutes = p_eta, claimed_at = now()
   where id = p_request and claimed_channel_id is null and status = 'open';
  get diagnostics n = row_count;
  return n = 1;
end $$;
revoke all on function public.sos_claim(integer, integer, integer) from public, anon, authenticated;
