-- Custom page background for a Channel. Paid tiers only; free Channels keep the HubLinkPro navy.
-- The app only accepts dark colors so text stays readable.
alter table public.channels
  add column if not exists bg_color text check (bg_color ~ '^#[0-9a-fA-F]{6}$');

create or replace function public.guard_channel_bg() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.tier, 'free') not in ('pro', 'favorite') then new.bg_color := null; end if;
  elsif new.bg_color is distinct from old.bg_color and coalesce(new.tier, 'free') not in ('pro', 'favorite') then
    new.bg_color := old.bg_color;
  end if;
  return new;
end $$;

drop trigger if exists channels_guard_bg on public.channels;
create trigger channels_guard_bg before insert or update on public.channels
  for each row execute function public.guard_channel_bg();
