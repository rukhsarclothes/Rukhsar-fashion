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

`SUPABASE_SERVICE_ROLE_KEY` is required for server-side admin writes and server-side role verification. Never expose the service role key in frontend code or as a `VITE_*` variable.

## SQL Schema

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.

It creates:
- `profiles`
- `user_roles`
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

If you already ran the schema before Supabase Auth support was added, run [supabase/auth-profiles.sql](supabase/auth-profiles.sql) once in the SQL Editor.

## Supabase Auth and Google Login

Enable email/password auth:
1. Supabase Dashboard > Authentication > Providers.
2. Enable Email.
3. Decide whether email confirmation is required for your store.

Enable Google OAuth:
1. Supabase Dashboard > Authentication > Providers > Google.
2. Add your Google OAuth Client ID and Client Secret.
3. In Google Cloud Console, add the Supabase callback URL shown in the Google provider settings.

Configure Supabase redirect URLs:
- Site URL: `https://rukhsar-fashion.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://rukhsar-fashion.vercel.app/**`
  - any Vercel preview wildcard you use, for example `https://*-rukhsarclothes*.vercel.app/**`

The app uses these callback URLs:
- Local user/admin Google callback: `http://localhost:3000/auth/callback?role=customer`
- Local admin Google callback: `http://localhost:3000/auth/callback?role=admin`
- Production user/admin Google callback: `https://rukhsar-fashion.vercel.app/auth/callback?role=customer`
- Production admin Google callback: `https://rukhsar-fashion.vercel.app/auth/callback?role=admin`

## Add an Admin User

Admin access is server-verified from Supabase. After the admin signs in once with Google or email/password, run this SQL with their email:

```sql
insert into public.admin_users (user_id, email, role)
select id, email, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = excluded.role, email = excluded.email;

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set role = excluded.role, updated_at = now();
```

If a Google account is not listed as admin, `/admin/dashboard` will reject it with: `This Google account is not authorized for admin access.`

## RLS Policies

The SQL enables Row Level Security on all public tables.

Current policy model:
- Public users can read only active products.
- Public users can insert seller applications.
- Public users can read store settings.
- Users can read/update their own profile.
- Users can read their own role.
- Admin access requires `admin_users` / `user_roles` role data.
- Server-side admin APIs verify the Supabase session or local fallback session and require admin role.

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
