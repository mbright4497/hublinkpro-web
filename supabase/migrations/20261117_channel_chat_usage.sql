-- One row per visitor question to a Channel's AI assistant. Used only to cap abuse and cost.
-- No message text is stored. RLS is on with no policies, so only the server (service role) can touch it.
create table if not exists public.channel_chat_usage (
  id bigserial primary key,
  channel_id integer not null references public.channels(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists channel_chat_usage_ip_idx on public.channel_chat_usage (ip_hash, created_at desc);
create index if not exists channel_chat_usage_channel_idx on public.channel_chat_usage (channel_id, created_at desc);
alter table public.channel_chat_usage enable row level security;
