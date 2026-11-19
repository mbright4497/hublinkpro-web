-- Free CRM for every Channel.
-- One lead per person per Channel, filled in automatically from bookings, booking requests and
-- calls by database triggers. Nothing here calls an outside service, so it costs nothing per use.
-- Capture can never break the thing it listens to: every trigger swallows its own errors.

create table public.leads (
  id integer generated always as identity primary key,
  channel_id integer not null references public.channels(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text check (phone is null or char_length(phone) between 7 and 30),
  phone_key text,
  email text check (email is null or char_length(email) <= 200),
  service text check (service is null or char_length(service) <= 120),
  source text not null default 'manual' check (source in ('manual', 'booking', 'request', 'call')),
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'booked', 'won', 'lost')),
  value_cents integer check (value_cents is null or (value_cents >= 0 and value_cents <= 100000000)),
  follow_up_on date,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Same phone number on the same Channel is the same person.
create unique index leads_channel_phone_key on public.leads (channel_id, phone_key) where phone_key is not null;
create index leads_channel_status on public.leads (channel_id, status);
create index leads_channel_follow_up on public.leads (channel_id, follow_up_on) where follow_up_on is not null;
create index leads_channel_email on public.leads (channel_id, lower(email)) where email is not null;

create table public.lead_events (
  id integer generated always as identity primary key,
  lead_id integer not null references public.leads(id) on delete cascade,
  channel_id integer not null references public.channels(id) on delete cascade,
  kind text not null check (kind in ('created', 'note', 'status', 'call', 'booking', 'request', 'follow_up', 'edit')),
  body text check (body is null or char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index lead_events_lead on public.lead_events (lead_id, created_at desc);

-- Housekeeping triggers ------------------------------------------------------------------------

create function public.leads_before_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Keeps one Channel from filling the shared database.
  if (select count(*) from public.leads where channel_id = new.channel_id) >= 2000 then
    raise exception 'lead_limit';
  end if;
  return new;
end $$;

create trigger leads_cap before insert on public.leads
  for each row execute function public.leads_before_insert();

create function public.leads_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger leads_touch before update on public.leads
  for each row execute function public.leads_touch();

-- Row level security ---------------------------------------------------------------------------

alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

create policy leads_admin_all on public.leads for all to authenticated
  using (is_admin()) with check (is_admin());
create policy leads_owner_select on public.leads for select to authenticated
  using (exists (select 1 from public.channels c where c.id = leads.channel_id and c.owner_id = (select auth.uid())));
create policy leads_owner_insert on public.leads for insert to authenticated
  with check (source = 'manual' and exists (select 1 from public.channels c where c.id = leads.channel_id and c.owner_id = (select auth.uid())));
create policy leads_owner_update on public.leads for update to authenticated
  using (exists (select 1 from public.channels c where c.id = leads.channel_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.channels c where c.id = leads.channel_id and c.owner_id = (select auth.uid())));
create policy leads_owner_delete on public.leads for delete to authenticated
  using (exists (select 1 from public.channels c where c.id = leads.channel_id and c.owner_id = (select auth.uid())));

create policy lead_events_admin_all on public.lead_events for all to authenticated
  using (is_admin()) with check (is_admin());
create policy lead_events_owner_select on public.lead_events for select to authenticated
  using (exists (select 1 from public.channels c where c.id = lead_events.channel_id and c.owner_id = (select auth.uid())));
-- The timeline is append-only for owners: they can add notes and changes, never rewrite history.
create policy lead_events_owner_insert on public.lead_events for insert to authenticated
  with check (
    kind in ('note', 'status', 'follow_up', 'edit')
    and exists (select 1 from public.channels c where c.id = lead_events.channel_id and c.owner_id = (select auth.uid()))
    and exists (select 1 from public.leads l where l.id = lead_events.lead_id and l.channel_id = lead_events.channel_id)
  );

-- Automatic capture ----------------------------------------------------------------------------

create function public.crm_capture(
  p_channel integer, p_name text, p_phone text, p_email text, p_service text,
  p_source text, p_kind text, p_body text, p_advance boolean, p_at timestamptz
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  k text;
  em text;
  nm text;
  lid integer;
  ph text;
  sv text;
begin
  k := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if char_length(k) < 7 then k := null; end if;
  em := nullif(lower(btrim(coalesce(p_email, ''))), '');
  ph := nullif(btrim(coalesce(p_phone, '')), '');
  sv := nullif(left(btrim(coalesce(p_service, '')), 120), '');
  nm := left(coalesce(nullif(btrim(coalesce(p_name, '')), ''), ph, 'Unknown caller'), 120);

  if k is not null then
    select id into lid from leads where channel_id = p_channel and phone_key = k;
  end if;
  if lid is null and em is not null then
    select id into lid from leads where channel_id = p_channel and lower(email) = em order by id limit 1;
  end if;

  if lid is null then
    insert into leads (channel_id, name, phone, phone_key, email, service, source, status, last_activity_at, created_at)
    values (p_channel, nm, ph, k, em, sv, p_source, case when p_advance then 'booked' else 'new' end,
            coalesce(p_at, now()), coalesce(p_at, now()))
    returning id into lid;
  else
    update leads set
      last_activity_at = greatest(last_activity_at, coalesce(p_at, now())),
      -- A real name replaces a bare phone number once we learn it.
      name = case when (name = 'Unknown caller' or name = phone) and nullif(btrim(coalesce(p_name, '')), '') is not null
                  then left(btrim(p_name), 120) else name end,
      phone = coalesce(phone, ph),
      phone_key = coalesce(phone_key, k),
      email = coalesce(email, em),
      service = coalesce(service, sv),
      status = case when p_advance and status in ('new', 'contacted', 'quoted') then 'booked' else status end
    where id = lid;
  end if;

  insert into lead_events (lead_id, channel_id, kind, body, created_at)
  values (lid, p_channel, p_kind, left(p_body, 2000), coalesce(p_at, now()));
  return lid;
end $$;

revoke all on function public.crm_capture(integer, text, text, text, text, text, text, text, boolean, timestamptz)
  from public, anon, authenticated;

create function public.crm_from_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare tz text;
begin
  begin
    select booking_timezone into tz from channels where id = new.channel_id;
    perform crm_capture(
      new.channel_id, new.name, new.phone, new.email, new.service, 'booking', 'booking',
      'Booked ' || to_char(new.starts_at at time zone coalesce(tz, 'America/New_York'), 'FMDy, FMMon FMDD "at" FMHH12:MI AM')
        || case when new.message is not null then E'\n' || new.message else '' end,
      true, new.created_at);
  exception when others then
    raise warning 'crm_from_booking: %', sqlerrm;
  end;
  return new;
end $$;

create function public.crm_from_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform crm_capture(
      new.channel_id, new.name, new.phone, new.email, new.service, 'request', 'request',
      'Asked for ' || coalesce(new.service, 'a callback') || coalesce(' · ' || new.preferred_time, '')
        || case when new.message is not null then E'\n' || new.message else '' end,
      false, new.created_at);
  exception when others then
    raise warning 'crm_from_request: %', sqlerrm;
  end;
  return new;
end $$;

create function public.crm_from_call() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.from_number is not null and char_length(regexp_replace(new.from_number, '\D', '', 'g')) >= 7 then
      perform crm_capture(new.channel_id, null, new.from_number, null, null, 'call', 'call',
        'Called your tracking number', false, new.created_at);
    end if;
  exception when others then
    raise warning 'crm_from_call: %', sqlerrm;
  end;
  return new;
end $$;

create function public.crm_from_call_result() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
  lid integer;
begin
  begin
    if new.status is distinct from old.status
       and new.status in ('answered', 'missed', 'failed')
       and new.from_number is not null then
      k := right(regexp_replace(new.from_number, '\D', '', 'g'), 10);
      if char_length(k) >= 7 then
        select id into lid from leads where channel_id = new.channel_id and phone_key = k;
        if lid is not null then
          insert into lead_events (lead_id, channel_id, kind, body)
          values (lid, new.channel_id, 'call',
            case new.status
              when 'answered' then 'Call answered'
                || case when coalesce(new.duration_seconds, 0) > 0
                        then ' (' || greatest(1, round(new.duration_seconds / 60.0))::int || ' min)' else '' end
              when 'missed' then 'Missed call'
              else 'Call failed' end);
          -- Talking to someone moves a brand-new lead along.
          if new.status = 'answered' then
            update leads set status = 'contacted', last_activity_at = now() where id = lid and status = 'new';
          else
            update leads set last_activity_at = now() where id = lid;
          end if;
        end if;
      end if;
    end if;
  exception when others then
    raise warning 'crm_from_call_result: %', sqlerrm;
  end;
  return new;
end $$;

create trigger crm_booking after insert on public.bookings
  for each row execute function public.crm_from_booking();
create trigger crm_request after insert on public.booking_requests
  for each row execute function public.crm_from_request();
create trigger crm_call after insert on public.call_logs
  for each row execute function public.crm_from_call();
create trigger crm_call_result after update of status on public.call_logs
  for each row execute function public.crm_from_call_result();

-- Backfill: turn what is already in the database into leads, oldest first.
do $$
declare
  r record;
  tz text;
begin
  for r in
    select 'request' as t, channel_id, name, phone, email, service, message, preferred_time,
           null::timestamptz as starts_at, created_at
      from public.booking_requests
    union all
    select 'booking', channel_id, name, phone, email, service, message, null,
           starts_at, created_at
      from public.bookings
    union all
    select 'call', channel_id, null, from_number, null, null, null, null,
           null, created_at
      from public.call_logs
     where char_length(regexp_replace(coalesce(from_number, ''), '\D', '', 'g')) >= 7
    order by created_at
  loop
    if r.t = 'booking' then
      select booking_timezone into tz from public.channels where id = r.channel_id;
      perform public.crm_capture(r.channel_id, r.name, r.phone, r.email, r.service, 'booking', 'booking',
        'Booked ' || to_char(r.starts_at at time zone coalesce(tz, 'America/New_York'), 'FMDy, FMMon FMDD "at" FMHH12:MI AM')
          || case when r.message is not null then E'\n' || r.message else '' end,
        true, r.created_at);
    elsif r.t = 'request' then
      perform public.crm_capture(r.channel_id, r.name, r.phone, r.email, r.service, 'request', 'request',
        'Asked for ' || coalesce(r.service, 'a callback') || coalesce(' · ' || r.preferred_time, '')
          || case when r.message is not null then E'\n' || r.message else '' end,
        false, r.created_at);
    else
      perform public.crm_capture(r.channel_id, null, r.phone, null, null, 'call', 'call',
        'Called your tracking number', false, r.created_at);
    end if;
  end loop;
end $$;

-- Trigger functions are only ever fired by their triggers; nobody should be able to call them over the API.
revoke all on function public.crm_from_booking() from public, anon, authenticated;
revoke all on function public.crm_from_request() from public, anon, authenticated;
revoke all on function public.crm_from_call() from public, anon, authenticated;
revoke all on function public.crm_from_call_result() from public, anon, authenticated;
