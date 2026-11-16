-- Live food truck locations. One row per truck; it only shows publicly while live_until is in the future.
create table if not exists public.truck_locations (
  channel_id integer primary key references public.channels(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  note text check (char_length(note) <= 120),
  updated_at timestamptz not null default now(),
  live_until timestamptz not null
);
alter table public.truck_locations enable row level security;
grant select on public.truck_locations to anon, authenticated;
grant insert, update, delete on public.truck_locations to authenticated;

create policy truck_loc_public_read on public.truck_locations for select
  using (live_until > now() and exists (select 1 from public.channels c where c.id = channel_id and c.status = 'live' and c.is_food_truck));
create policy truck_loc_owner_read on public.truck_locations for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and c.owner_id = auth.uid()));
create policy truck_loc_owner_insert on public.truck_locations for insert to authenticated
  with check (live_until <= now() + interval '13 hours' and exists (select 1 from public.channels c where c.id = channel_id and c.owner_id = auth.uid() and c.is_food_truck));
create policy truck_loc_owner_update on public.truck_locations for update to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and c.owner_id = auth.uid()))
  with check (live_until <= now() + interval '13 hours' and exists (select 1 from public.channels c where c.id = channel_id and c.owner_id = auth.uid() and c.is_food_truck));
create policy truck_loc_owner_delete on public.truck_locations for delete to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and c.owner_id = auth.uid()));
create policy truck_loc_admin_all on public.truck_locations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
