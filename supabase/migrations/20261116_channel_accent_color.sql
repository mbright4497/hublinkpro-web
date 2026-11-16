-- Custom accent color for a Channel's page. Paid tiers only; free Channels keep the HubLinkPro orange.
alter table public.channels
  add column if not exists accent_color text check (accent_color ~ '^#[0-9a-fA-F]{6}$');

create or replace function public.guard_channel_accent() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.tier, 'free') not in ('pro', 'favorite') then new.accent_color := null; end if;
  elsif new.accent_color is distinct from old.accent_color and coalesce(new.tier, 'free') not in ('pro', 'favorite') then
    new.accent_color := old.accent_color;
  end if;
  return new;
end $$;

drop trigger if exists channels_guard_accent on public.channels;
create trigger channels_guard_accent before insert or update on public.channels
  for each row execute function public.guard_channel_accent();
