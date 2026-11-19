-- Blog posts written from the admin editor. Public can read published posts only; admin can do everything.
create table if not exists public.blog_posts (
  id integer generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 200),
  service text check (service is null or char_length(service) <= 40),
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
create policy "public reads published posts" on public.blog_posts for select to anon, authenticated using (published);
create policy "admin manages posts" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
