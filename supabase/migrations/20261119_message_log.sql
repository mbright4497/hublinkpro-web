-- Log of every email/SMS the site sends, so the admin can see communication per Channel.
-- Server-only: RLS on, no policies. Written and read with the service role.
create table if not exists public.message_log (
  id integer generated always as identity primary key,
  channel_id integer references public.channels(id) on delete set null,
  user_id uuid,
  medium text not null check (medium in ('email','sms')),
  label text not null default '',
  to_addr text not null,
  subject text,
  body text,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists message_log_channel_idx on public.message_log (channel_id, created_at desc);
create index if not exists message_log_user_idx on public.message_log (user_id, created_at desc);
alter table public.message_log enable row level security;
revoke all on public.message_log from anon, authenticated;
