-- Rukhsar Fashion Supabase schema
-- Run this in the Supabase SQL Editor before enabling the app against Supabase.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key default ('prod_' || replace(gen_random_uuid()::text, '-', '')),
  name text not null,
  slug text unique not null,
  description text not null,
  category text not null,
  price numeric(12,2) not null check (price > 0),
  discount_price numeric(12,2) default 0 check (discount_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  thumbnail_url text,
  gallery_urls text[] not null default '{}',
  video_url text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id text,
  customer jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  total numeric(12,2) not null default 0,
  payment jsonb not null default '{}'::jsonb,
  shipment jsonb not null default '{}'::jsonb,
  status text not null default 'Placed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  size text not null,
  color text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_applications (
  id text primary key default ('sel_' || replace(gen_random_uuid()::text, '-', '')),
  full_name text not null,
  shop_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  product_category text not null,
  website text,
  message text not null,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  section text primary key,
  values jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seller_applications enable row level security;
alter table public.store_settings enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can create seller applications" on public.seller_applications;
create policy "Public can create seller applications"
on public.seller_applications for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read seller applications" on public.seller_applications;
create policy "Admins can read seller applications"
on public.seller_applications for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
on public.store_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Admins can manage store settings"
on public.store_settings for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- Grants for API roles. RLS policies above still decide which rows/actions are allowed.
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert on public.seller_applications to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.seller_applications to authenticated;
grant select, insert, update, delete on public.store_settings to authenticated;
grant select on public.admin_users to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public can read product media" on storage.objects;
create policy "Public can read product media"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('product-media', 'brand-assets'));

drop policy if exists "Admins can manage product media" on storage.objects;
create policy "Admins can manage product media"
on storage.objects for all
to authenticated
using (
  bucket_id in ('product-media', 'brand-assets')
  and exists (select 1 from public.admin_users where user_id = auth.uid())
)
with check (
  bucket_id in ('product-media', 'brand-assets')
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);

-- Sample products
insert into public.products
  (id, name, slug, description, category, price, discount_price, stock, sizes, colors, thumbnail_url, gallery_urls, video_url, featured, active)
values
  ('prod-ishq-chikankari', 'Ishq Ivory Chikankari Kurta', 'ishq-ivory-chikankari-kurta', 'Timeless hand-embroidered elegance for every occasion, finished in airy fabric and refined detailing.', 'chikankari', 2799, 2519, 18, array['XS','S','M','L','XL','XXL'], array['Ivory','Champagne'], 'https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?auto=format&fit=crop&w=900&q=72', array[]::text[], '', true, true),
  ('prod-anaya-kurta', 'Anaya Blush Kurta Set', 'anaya-blush-kurta-set', 'A soft cotton kurta set with delicate detailing, made for festive brunches and graceful everyday dressing.', 'Kurta Sets', 1899, 1671, 24, array['S','M','L','XL'], array['Blush Pink','Ivory'], 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=72', array[]::text[], '', true, true)
on conflict (id) do nothing;
