-- ============================================================
-- BrainBuzzer – Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────
-- Extends auth.users with app-specific fields.
-- A row is created automatically via trigger when a user signs up.

create table public.profiles (
  id             uuid references auth.users on delete cascade primary key,
  name           text        not null default '',
  role           text        not null default 'user' check (role in ('user', 'admin')),
  department     text,
  weekly_target  numeric     not null default 0,
  color          text        not null default '#6366f1',
  active         boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: check if the calling user is an admin
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ── companies ────────────────────────────────────────────────────

create table public.companies (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null,
  color      text        not null default '#6366f1',
  archived   boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── projects ─────────────────────────────────────────────────────

create table public.projects (
  id         uuid        primary key default uuid_generate_v4(),
  company_id uuid        not null references public.companies on delete cascade,
  name       text        not null,
  emoji      text,
  archived   boolean     not null default false,
  created_at timestamptz not null default now()
);

create index on public.projects (company_id);

-- ── time_entries ─────────────────────────────────────────────────

create table public.time_entries (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references auth.users on delete cascade,
  company_id       uuid        references public.companies on delete set null,
  project_id       uuid        references public.projects  on delete set null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  duration_seconds integer     not null check (duration_seconds >= 0),
  note             text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index on public.time_entries (user_id);
create index on public.time_entries (started_at desc);
create index on public.time_entries (company_id);

-- ── templates (quick-start) ──────────────────────────────────────

create table public.templates (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users on delete cascade,
  company_id uuid not null references public.companies on delete cascade,
  project_id uuid references public.projects on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, company_id, project_id)
);

create index on public.templates (user_id);

-- ── Row Level Security ────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.companies    enable row level security;
alter table public.projects     enable row level security;
alter table public.time_entries enable row level security;
alter table public.templates    enable row level security;

-- profiles: users see own row; admins see all
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- companies: all authenticated users read; only admins write
create policy "companies_read" on public.companies
  for select using (auth.role() = 'authenticated');

create policy "companies_write_admin" on public.companies
  for all using (public.is_admin());

-- projects: same as companies
create policy "projects_read" on public.projects
  for select using (auth.role() = 'authenticated');

create policy "projects_write_admin" on public.projects
  for all using (public.is_admin());

-- time_entries: users see/write own; admins see all
create policy "entries_select_own" on public.time_entries
  for select using (user_id = auth.uid() or public.is_admin());

create policy "entries_insert_own" on public.time_entries
  for insert with check (user_id = auth.uid());

create policy "entries_update_own" on public.time_entries
  for update using (user_id = auth.uid() or public.is_admin());

create policy "entries_delete_own" on public.time_entries
  for delete using (user_id = auth.uid() or public.is_admin());

-- templates: users manage only their own
create policy "templates_own" on public.templates
  for all using (user_id = auth.uid());

-- ── updated_at auto-update trigger ───────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at before update on public.companies    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.time_entries for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles     for each row execute function public.set_updated_at();
