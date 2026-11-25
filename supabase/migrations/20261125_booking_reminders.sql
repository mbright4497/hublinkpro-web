-- Marks when a booking's day-before reminder text went out, so a retry or two overlapping runs can never text twice.
alter table public.bookings add column if not exists reminder_sent_at timestamptz;
create index if not exists bookings_reminder_due_idx on public.bookings (starts_at) where reminder_sent_at is null and status = 'confirmed';
