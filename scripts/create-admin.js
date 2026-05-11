const { createClient } = require("@supabase/supabase-js");
require("../server");

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "").trim();
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  if (!email) throw new Error("ADMIN_EMAIL is required.");
  if (!password || password.length < 8) throw new Error("ADMIN_PASSWORD is required and must be at least 8 characters.");
  if (!url) throw new Error("SUPABASE_URL is required.");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const existing = await findUserByEmail(supabase, email);
  let user = existing;

  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: user.user_metadata?.full_name || "Rukhsar Admin" }
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Rukhsar Admin" }
    });
    if (error) throw error;
    user = data.user;
  }

  await upsertAdminRows(supabase, user);
  console.log(`Admin ready: ${email}`);
}

async function findUserByEmail(supabase, emailToFind) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find(item => item.email?.toLowerCase() === emailToFind);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function upsertAdminRows(supabase, user) {
  const profile = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || "Rukhsar Admin",
    email: user.email,
    updated_at: new Date().toISOString()
  }, { onConflict: "id" });
  if (profile.error && profile.error.code !== "42P01") throw profile.error;

  const admin = await supabase.from("admin_users").upsert({
    user_id: user.id,
    email: user.email,
    role: "admin"
  }, { onConflict: "user_id" });
  if (admin.error) throw admin.error;

  const role = await supabase.from("user_roles").upsert({
    user_id: user.id,
    role: "admin",
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (role.error && role.error.code !== "42P01") throw role.error;
}

main().catch(error => {
  console.error(`Create admin failed: ${error.message}`);
  process.exit(1);
});
