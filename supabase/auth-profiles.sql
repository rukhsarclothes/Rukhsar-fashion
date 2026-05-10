-- Supabase Auth support for Rukhsar Fashion.
-- Run this in Supabase SQL Editor after the base schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage user roles" on public.user_roles;
create policy "Admins can manage user roles"
on public.user_roles for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;

-- Promote an existing Supabase Auth user to admin:
-- Replace admin@example.com with the Google/email account that should access /admin/dashboard.
--
-- insert into public.admin_users (user_id, email, role)
-- select id, email, 'admin'
-- from auth.users
-- where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role, email = excluded.email;
--
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'
-- from auth.users
-- where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role, updated_at = now();
