-- Consumer verification: a request only reaches a pro after the sender confirms a texted 6-digit code.
-- One row per request (booking or SOS). The code is stored hashed, expires in 10 minutes, and allows 5 tries.
create table public.request_verifications (
  id integer generated always as identity primary key,
  kind text not null check (kind in ('booking', 'sos')),
  request_id integer not null,
  token text not null unique,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  sends integer not null default 1,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz,
  ip_hash text,
  created_at timestamptz not null default now(),
  unique (kind, request_id)
);
create index request_verifications_phone_idx on public.request_verifications (phone, created_at);
create index request_verifications_ip_idx on public.request_verifications (ip_hash, created_at);
alter table public.request_verifications enable row level security; -- server-only: no policies on purpose
revoke all on public.request_verifications from anon, authenticated;

-- Phones and emails a pro has flagged as "not a real request". Server-only.
create table public.blocked_contacts (
  id integer generated always as identity primary key,
  kind text not null check (kind in ('phone', 'email')),
  value text not null,
  reason text,
  flagged_by_channel_id integer,
  created_at timestamptz not null default now(),
  unique (kind, value)
);
alter table public.blocked_contacts enable row level security;
revoke all on public.blocked_contacts from anon, authenticated;

-- Requests carry the moment they were confirmed. Everything that already exists counts as confirmed.
alter table public.booking_requests add column verified_at timestamptz;
alter table public.sos_requests add column verified_at timestamptz;
update public.booking_requests set verified_at = created_at where verified_at is null;
update public.sos_requests set verified_at = created_at where verified_at is null;

alter table public.booking_requests drop constraint booking_requests_status_check;
alter table public.booking_requests add constraint booking_requests_status_check
  check (status = any (array['new', 'contacted', 'booked', 'closed', 'fake']));

-- Pros only ever see confirmed requests. Visitors can only create unconfirmed ones.
drop policy "owner reads own requests" on public.booking_requests;
create policy "owner reads own requests" on public.booking_requests for select to authenticated
  using (verified_at is not null and exists (select 1 from public.channels c where c.id = booking_requests.channel_id and c.owner_id = auth.uid()));

drop policy "owner updates own requests" on public.booking_requests;
create policy "owner updates own requests" on public.booking_requests for update to authenticated
  using (verified_at is not null and exists (select 1 from public.channels c where c.id = booking_requests.channel_id and c.owner_id = auth.uid()))
  with check (verified_at is not null and exists (select 1 from public.channels c where c.id = booking_requests.channel_id and c.owner_id = auth.uid()));

drop policy "public can request live channels" on public.booking_requests;
create policy "public can request live channels" on public.booking_requests for insert to anon, authenticated
  with check (status = 'new' and verified_at is null and exists (select 1 from public.channels c where c.id = booking_requests.channel_id and c.status = 'live'));
