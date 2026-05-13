-- Fix RLS recursion for Rukhsar Fashion.
-- Run this in Supabase SQL Editor after supabase/schema.sql.
-- The old policies queried public.admin_users directly from admin_users policies,
-- which can trigger "infinite recursion detected in policy for relation admin_users".

create schema if not exists private;

create or replace function private.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users admin
    where admin.user_id = uid
      and admin.role = 'admin'
  );
$$;

revoke all on function private.is_admin(uuid) from public;
grant usage on schema private to anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(uuid) to anon;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.is_admin(uuid) to service_role;

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seller_applications enable row level security;
alter table public.store_settings enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or private.is_admin(auth.uid()));

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Users can read own role" on public.user_roles;
drop policy if exists "Admins can manage user roles" on public.user_roles;

create policy "Users can read own role"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()));

create policy "Admins can manage user roles"
on public.user_roles for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Users can read own admin row" on public.admin_users;
drop policy if exists "Admins can read admin users" on public.admin_users;
drop policy if exists "Admins can manage admin users" on public.admin_users;

create policy "Users can read own admin row"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read admin users"
on public.admin_users for select
to authenticated
using (private.is_admin(auth.uid()));

create policy "Admins can manage admin users"
on public.admin_users for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Public can read active products" on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true or private.is_admin(auth.uid()));

create policy "Admins can manage products"
on public.products for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Public can create seller applications" on public.seller_applications;
drop policy if exists "Admins can read seller applications" on public.seller_applications;
drop policy if exists "Admins can manage seller applications" on public.seller_applications;

create policy "Public can create seller applications"
on public.seller_applications for insert
to anon, authenticated
with check (true);

create policy "Admins can read seller applications"
on public.seller_applications for select
to authenticated
using (private.is_admin(auth.uid()));

create policy "Admins can manage seller applications"
on public.seller_applications for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Users can read own orders" on public.orders;
drop policy if exists "Users can create own orders" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;

create policy "Users can read own orders"
on public.orders for select
to authenticated
using (user_id = auth.uid()::text or private.is_admin(auth.uid()));

create policy "Users can create own orders"
on public.orders for insert
to authenticated
with check (user_id = auth.uid()::text);

create policy "Admins can manage orders"
on public.orders for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Users can read own order items" on public.order_items;
drop policy if exists "Users can create own order items" on public.order_items;
drop policy if exists "Admins can manage order items" on public.order_items;

create policy "Users can read own order items"
on public.order_items for select
to authenticated
using (
  private.is_admin(auth.uid())
  or exists (
    select 1
    from public.orders orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()::text
  )
);

create policy "Users can create own order items"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()::text
  )
);

create policy "Admins can manage order items"
on public.order_items for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Public can read store settings" on public.store_settings;
drop policy if exists "Admins can manage store settings" on public.store_settings;

create policy "Public can read store settings"
on public.store_settings for select
to anon, authenticated
using (true);

create policy "Admins can manage store settings"
on public.store_settings for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "Public can read product media" on storage.objects;
drop policy if exists "Public can read brand assets" on storage.objects;
drop policy if exists "Admins can manage product media" on storage.objects;
drop policy if exists "Admins can manage brand assets" on storage.objects;

create policy "Public can read product media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-media');

create policy "Public can read brand assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'brand-assets');

create policy "Admins can manage product media"
on storage.objects for all
to authenticated
using (bucket_id = 'product-media' and private.is_admin(auth.uid()))
with check (bucket_id = 'product-media' and private.is_admin(auth.uid()));

create policy "Admins can manage brand assets"
on storage.objects for all
to authenticated
using (bucket_id = 'brand-assets' and private.is_admin(auth.uid()))
with check (bucket_id = 'brand-assets' and private.is_admin(auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert on public.seller_applications to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.seller_applications to authenticated;
grant select, insert, update, delete on public.store_settings to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
