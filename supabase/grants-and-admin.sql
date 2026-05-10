-- Run this after supabase/schema.sql if public inserts or authenticated admin reads/writes
-- report permission/RLS errors. RLS policies still decide row access.

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
