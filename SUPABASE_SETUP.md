# Rukhsar Fashion Supabase Setup

This project uses a Node server with vanilla frontend files. The browser calls `/api/*`; the server reads Supabase credentials from environment variables.

## Environment Variables

Local development uses `.env.local`:

```text
SUPABASE_URL=https://waujhojqvabhyqykgeft.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=optional-server-only-service-role-key
VITE_SUPABASE_URL=https://waujhojqvabhyqykgeft.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`SUPABASE_SERVICE_ROLE_KEY` is optional, but secure admin writes need either this server-only key or a future Supabase Auth admin session. Never expose the service role key in frontend code.

## SQL Schema

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.

It creates:
- `products`
- `orders`
- `order_items`
- `seller_applications`
- `store_settings`
- `admin_users`

It also creates the storage buckets:
- `product-media`
- `brand-assets`

If you already ran an older copy of the schema and see permission/RLS errors for seller applications or admin reads, run [supabase/grants-and-admin.sql](supabase/grants-and-admin.sql) once in the SQL Editor.

## RLS Policies

The SQL enables Row Level Security on all public tables.

Current policy model:
- Public users can read only active products.
- Public users can insert seller applications.
- Public users can read store settings.
- Admin table/order/settings writes require a Supabase Auth user listed in `admin_users`.

Temporary local admin limitation:
The current app still uses its local JSON-based admin login for the admin UI. For secure Supabase admin writes from this Node server, add `SUPABASE_SERVICE_ROLE_KEY` to the server environment. The key must stay server-only and must never be exposed as `VITE_*` or in frontend code.

Alternative production path:
1. Create an admin user with Supabase Auth.
2. Insert that auth user's UUID into `public.admin_users`.
3. Migrate the admin login to Supabase Auth so requests carry that authenticated JWT.

Without one of those two admin paths, Supabase will allow public reads but will reject product/order/settings writes by design.

## Seed Sample Products

The SQL includes two sample products, including `chikankari`.

To add more products manually:
1. Open Supabase Dashboard.
2. Go to Table Editor > `products`.
3. Add rows with `active = true`.
4. Use `category = chikankari` for Chikankari Collection products.

## Test Connection

After `.env.local` is present and the SQL has run:

```bash
npm start
```

Then open:

```text
http://localhost:3000/api/health
http://localhost:3000/api/products
http://localhost:3000/collections/chikankari
```

`/api/health` should include:

```json
{
  "ok": true,
  "supabaseConfigured": true
}
```

If tables are not created yet, API responses will show the exact Supabase error message.

## Media Storage

Use `product-media` for product thumbnails, galleries, and videos.
Use `brand-assets` for logos, favicons, banners, and homepage visuals.

The current admin form stores media URLs/data strings. After uploading media to Supabase Storage from the dashboard, paste the public URL into the product media URL section.
