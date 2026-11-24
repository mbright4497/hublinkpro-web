-- Maps an ElevenLabs voice agent to the Channel it answers for (used by /api/elevenlabs/post-call).
create table if not exists public.channel_voice_agents (
  id integer generated always as identity primary key,
  channel_id integer not null references public.channels(id) on delete cascade,
  agent_id text not null unique,
  created_at timestamptz not null default now()
);
alter table public.channel_voice_agents enable row level security;
create policy channel_voice_agents_admin_all on public.channel_voice_agents for all using (public.is_admin()) with check (public.is_admin());
create index if not exists channel_voice_agents_channel_idx on public.channel_voice_agents(channel_id);
