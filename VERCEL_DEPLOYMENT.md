# Rukhsar Fashion Vercel Deployment

## Project Settings

- Framework preset: Other / Node
- Root directory: `.`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `public`

The repository includes `vercel.json` for:
- `/api/*` serverless API routing
- SPA fallback routing to `index.html`
- static asset cache headers

## Required Production Environment Variables

Set these in Vercel Project Settings > Environment Variables for Production, Preview, and Development as needed:

```text
SUPABASE_URL=https://waujhojqvabhyqykgeft.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` as a frontend `VITE_*` variable.

Optional public aliases are not required because the browser calls the app's own `/api/*` routes:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Verification URLs

After deployment, verify:

```text
https://YOUR_DOMAIN/api/health
https://YOUR_DOMAIN/api/products
https://YOUR_DOMAIN/collections/chikankari
https://YOUR_DOMAIN/admin
```

`/api/health` should return:

```json
{
  "ok": true,
  "supabaseConfigured": true,
  "supabaseServiceRoleConfigured": true,
  "runtime": "vercel"
}
```

If `supabaseServiceRoleConfigured` is false, admin product CRUD and checkout order writes will fail in production.
