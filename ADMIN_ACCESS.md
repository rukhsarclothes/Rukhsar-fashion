# Rukhsar Fashion Admin Access

## Admin URL

Local admin login:

```text
http://localhost:3000/admin
```

Protected dashboard:

```text
http://localhost:3000/admin/dashboard
```

Opening `/admin/dashboard` without an admin session redirects to `/admin`.

## Local Demo Credentials

These credentials are for local/demo development only:

```text
Email: admin@rukhsarfashion.com
Password: Admin@123
```

Do not use these credentials in production.

## Admin User Role

Admin access is controlled by the `role` field on a user record:

```json
{
  "email": "admin@rukhsarfashion.com",
  "role": "admin"
}
```

Normal customer users use:

```json
{
  "role": "customer"
}
```

Only users with `role: "admin"` can access `/api/admin/*` routes and the `/admin/dashboard` UI.

## Creating Or Setting An Admin User

For this lightweight local JSON database, users are stored in:

```text
data/db.json
```

The app seeds a local admin automatically when the database is created. If you later move to Supabase, Firebase, or another database, create an admin user in the `users` or `adminUsers` collection/table and make sure the role field is exactly:

```text
admin
```

## Deployment Notes

After deployment, use the deployed site URL with the same paths:

```text
https://your-domain.com/admin
https://your-domain.com/admin/dashboard
```

Configure a production admin account with a secure password and remove or replace demo credentials before going live.

## Environment Variables

Copy `.env.example` for deployment configuration. Keep payment and logistics secrets server-side only:

```text
PORT
NODE_ENV
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SHIPROCKET_EMAIL
SHIPROCKET_PASSWORD
SHIPROCKET_TOKEN
```
