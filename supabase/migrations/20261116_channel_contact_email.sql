-- Optional public email, only included in the "Save to contacts" card when the owner fills it in.
alter table public.channels
  add column if not exists contact_email text check (contact_email is null or (char_length(contact_email) <= 120 and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));
