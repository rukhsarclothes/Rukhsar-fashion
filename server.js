const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const { createClient } = require("@supabase/supabase-js");

loadEnvFile(".env.local");
loadEnvFile(".env");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "rukhsar-fashion-data") : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const SECRET_FIELDS = new Set(["razorpayKeySecret", "razorpayWebhookSecret", "shiprocketPassword", "shiprocketToken"]);
const MAX_JSON_BYTES = 25 * 1024 * 1024;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || SUPABASE_SERVICE_ROLE_KEY || "rukhsar-local-dev-secret";
const DISABLE_SUPABASE = process.env.DISABLE_SUPABASE === "1";
const supabaseConfigErrors = [];
const supabase = createSupabaseClient("anon", SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createSupabaseClient("service", SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) || supabase;

function createSupabaseClient(label, url, key) {
  if (DISABLE_SUPABASE) return null;
  if (!url || !key) {
    supabaseConfigErrors.push(`Supabase ${label} client is missing ${!url ? "URL" : "key"}.`);
    return null;
  }
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (error) {
    supabaseConfigErrors.push(`Supabase ${label} client failed to initialize: ${error.message}`);
    return null;
  }
}

function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, fileName);
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const seedProducts = [
  {
    id: "prod-ishq-chikankari",
    name: "Ishq Ivory Chikankari Kurta",
    category: "chikankari",
    price: 2799,
    discountPrice: 2519,
    discount: 10,
    stock: 18,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Ivory", "Champagne"],
    thumbnail: "https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?auto=format&fit=crop&w=900&q=72",
    images: ["https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?auto=format&fit=crop&w=900&q=72"],
    galleryImages: ["https://images.unsplash.com/photo-1622122201714-77da0ca8e5d2?auto=format&fit=crop&w=900&q=72"],
    videoUrl: "",
    description: "Timeless hand-embroidered elegance for every occasion, finished in airy fabric and refined detailing.",
    featured: true,
    status: "active"
  },
  {
    id: "prod-anaya-kurta",
    name: "Anaya Blush Kurta Set",
    category: "Kurta Sets",
    price: 1899,
    discountPrice: 1671,
    discount: 12,
    stock: 24,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Blush Pink", "Ivory"],
    thumbnail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=72",
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=72"],
    galleryImages: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=72"],
    videoUrl: "",
    description: "A soft cotton kurta set with delicate detailing, made for festive brunches and graceful everyday dressing.",
    featured: true,
    status: "active"
  },
  {
    id: "prod-zoya-saree",
    name: "Zoya Rose Organza Saree",
    category: "Sarees",
    price: 3299,
    discountPrice: 2705,
    discount: 18,
    stock: 11,
    sizes: ["Free Size"],
    colors: ["Rose Gold", "Peach"],
    thumbnail: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=72",
    images: ["https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=72"],
    galleryImages: ["https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=72"],
    videoUrl: "",
    description: "A feather-light organza saree with a refined sheen and minimal border for a polished occasion look.",
    featured: true,
    status: "active"
  },
  {
    id: "prod-meher-dress",
    name: "Meher Ivory Midi Dress",
    category: "Dresses",
    price: 2199,
    discountPrice: 2023,
    discount: 8,
    stock: 17,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Ivory", "Soft Beige"],
    thumbnail: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=72",
    images: ["https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=72"],
    galleryImages: ["https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=72"],
    videoUrl: "",
    description: "A clean ivory midi dress with a relaxed silhouette, designed for warm days and effortless styling.",
    featured: true,
    status: "active"
  },
  {
    id: "prod-naz-coord",
    name: "Naz Floral Co-ord Set",
    category: "Co-ord Sets",
    price: 2499,
    discountPrice: 2124,
    discount: 15,
    stock: 20,
    sizes: ["S", "M", "L"],
    colors: ["Floral Pink", "Sage"],
    thumbnail: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=72",
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=72"],
    galleryImages: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=72"],
    videoUrl: "",
    description: "A breathable floral co-ord set with a feminine print and polished fit for day-to-evening dressing.",
    featured: false,
    status: "active"
  }
];

function defaultSettings() {
  return {
    general: {
      storeName: "Rukhsar Fashion",
      tagline: "Premium women's fashion in ivory, blush, rose, and quiet festive detail.",
      supportEmail: "support@rukhsarfashion.com",
      supportPhone: "",
      whatsappNumber: "",
      businessAddress: "",
      gstNumber: "",
      currency: "INR",
      timezone: "Asia/Kolkata",
      maintenanceMode: false,
      storeActive: true
    },
    branding: {
      logo: "",
      favicon: "",
      footerLogo: "",
      primaryColor: "#76564f",
      accentColor: "#C98C8C",
      champagneColor: "#c8a76a",
      homepageBanners: [],
      mobileBanners: [],
      promotionalBanners: []
    },
    homepage: {
      heroTitle: "Modern Ethnic Elegance",
      heroSubtitle: "Crafted for graceful celebrations, intimate moments, and everyday rituals of beauty.",
      heroCtaText: "Shop Collection",
      heroMedia: "",
      featuredCollections: ["chikankari"],
      chikankariEnabled: true,
      chikankariTitle: "Chikankari Collection",
      chikankariCopy: "Timeless hand embroidery crafted for modern elegance.",
      categoryOrder: ["chikankari", "Kurta Sets", "Sarees", "Dresses", "Co-ord Sets"],
      promotionalStrips: ["Free shipping on prepaid orders"],
      announcementBarText: "",
      featuredProductsEnabled: true,
      collectionSectionEnabled: true
    },
    product: {
      categories: ["chikankari", "Kurta Sets", "Sarees", "Dresses", "Co-ord Sets", "Tunics"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Ivory", "Blush Pink", "Champagne", "Rose Gold", "Soft Beige"],
      featuredProductRules: "Manually selected by admin.",
      productVisibility: "active-only",
      inventoryTracking: true,
      lowStockThreshold: 5,
      defaultSorting: "featured"
    },
    payment: {
      razorpayEnabled: false,
      razorpayKeyId: "",
      razorpayKeySecret: "",
      razorpayWebhookSecret: "",
      paymentMode: "test",
      codEnabled: true,
      minCodAmount: 0,
      maxCodAmount: 10000,
      autoInvoice: false,
      successMessage: "Payment successful. Thank you for shopping with Rukhsar Fashion.",
      failureMessage: "Payment failed. Please try again or choose another payment method."
    },
    shipping: {
      shiprocketEnabled: false,
      shiprocketEmail: "",
      shiprocketPassword: "",
      shiprocketToken: "",
      pickupLocation: "",
      packageLength: 30,
      packageBreadth: 25,
      packageHeight: 5,
      packageWeight: 0.5,
      shippingModes: ["Surface"],
      codShippingEnabled: true,
      autoOrderSync: false,
      autoAwbGeneration: false,
      autoShipmentCreation: false
    },
    seo: {
      metaTitle: "Rukhsar Fashion - Premium Women's Clothing",
      metaDescription: "Shop premium women's fashion, kurta sets, sarees, dresses, and Chikankari Collection.",
      keywords: "women fashion, chikankari, kurta sets, sarees, dresses",
      ogImage: "",
      twitterCard: "summary_large_image",
      sitemapEnabled: true,
      robotsTxt: "User-agent: *\nAllow: /"
    },
    policies: {
      privacyPolicy: "",
      returnPolicy: "",
      shippingPolicy: "",
      termsConditions: "",
      refundPolicy: ""
    },
    social: {
      instagram: "",
      facebook: "",
      pinterest: "",
      youtube: "",
      whatsapp: "",
      twitter: ""
    },
    notifications: {
      orderConfirmationEmails: true,
      sellerInquiryNotifications: true,
      paymentAlerts: true,
      shippingAlerts: true,
      whatsappNotifications: false,
      adminNotificationEmail: "admin@rukhsarfashion.com"
    },
    security: {
      sessionTimeoutMinutes: 720,
      failedLoginProtection: true,
      maxFailedAttempts: 5,
      roleBasedAccess: true,
      loginActivityLogs: []
    },
    integrations: {
      googleAnalyticsId: "",
      metaPixelId: "",
      emailProvider: "",
      whatsappProvider: "",
      customWebhookUrl: ""
    }
  };
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const admin = createUserRecord({
      fullName: "Rukhsar Admin",
      email: "admin@rukhsarfashion.com",
      password: "Admin@123",
      role: "admin"
    });
    writeDb({
      users: [admin],
      products: seedProducts,
      orders: [],
      sellerApplications: [],
      sessions: [],
      payments: [],
      integrationLogs: [],
      settings: defaultSettings()
    });
    return;
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  let changed = false;
  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
    changed = true;
  }
  if (!Array.isArray(db.payments)) {
    db.payments = [];
    changed = true;
  }
  if (!Array.isArray(db.integrationLogs)) {
    db.integrationLogs = [];
    changed = true;
  }
  if (!db.settings) {
    db.settings = defaultSettings();
    changed = true;
  } else if (mergeMissingSettings(db.settings, defaultSettings())) {
    changed = true;
  }
  if (!db.users.some(user => user.role === "admin")) {
    db.users.push(createUserRecord({
      fullName: "Rukhsar Admin",
      email: "admin@rukhsarfashion.com",
      password: "Admin@123",
      role: "admin"
    }));
    changed = true;
  }
  for (const product of seedProducts) {
    const existing = db.products.find(item => item.id === product.id);
    if (!existing) {
      db.products.unshift(product);
      changed = true;
    } else if (normalizeProduct(existing)) {
      changed = true;
    }
  }
  for (const product of db.products) {
    if (normalizeProduct(product)) changed = true;
  }
  if (changed) {
    writeDb(db);
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function mergeMissingSettings(target, defaults) {
  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = value;
      changed = true;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      changed = mergeMissingSettings(target[key], value) || changed;
    }
  }
  return changed;
}

function sanitizeSettings(settings, forAdmin = false) {
  const clone = JSON.parse(JSON.stringify(settings || defaultSettings()));
  if (!forAdmin) {
    delete clone.payment.razorpayKeySecret;
    delete clone.payment.razorpayWebhookSecret;
    delete clone.shipping.shiprocketPassword;
    delete clone.shipping.shiprocketToken;
    delete clone.security.loginActivityLogs;
    return clone;
  }
  redactSecrets(clone);
  return clone;
}

function redactSecrets(value) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (SECRET_FIELDS.has(key)) value[key] = value[key] ? "********" : "";
    else redactSecrets(value[key]);
  }
}

function mergeSection(existing, incoming) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (SECRET_FIELDS.has(key) && (!value || value === "********")) continue;
    merged[key] = value;
  }
  return merged;
}

function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return hashPassword(password, salt).split(":")[1] === hash;
}

function logLogin(db, email, status, req) {
  db.settings.security.loginActivityLogs.unshift({
    email: clean(email).toLowerCase(),
    status,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local",
    createdAt: new Date().toISOString()
  });
  db.settings.security.loginActivityLogs = db.settings.security.loginActivityLogs.slice(0, 100);
}

function verifyHmacSignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function createLocalShipment(db, order) {
  const settings = db.settings.shipping;
  if (!settings.shiprocketEnabled || !settings.autoShipmentCreation) return null;
  const trackingId = `SR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  order.shipment = {
    provider: "Shiprocket",
    trackingId,
    awb: settings.autoAwbGeneration ? `AWB-${crypto.randomBytes(5).toString("hex").toUpperCase()}` : "",
    status: "Shipment Created",
    labelUrl: "",
    syncedAt: new Date().toISOString()
  };
  db.integrationLogs.unshift({
    id: uid("log"),
    type: "shiprocket",
    status: "success",
    message: `Local shipment created for ${order.id}`,
    createdAt: new Date().toISOString()
  });
  return order.shipment;
}

function createUserRecord({ fullName, email, password, role = "customer" }) {
  return {
    id: uid("usr"),
    fullName: clean(fullName),
    email: String(email).trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString()
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function publicSupabaseUser(authUser, role = "customer") {
  const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Customer";
  return {
    id: authUser.id,
    fullName: name,
    email: authUser.email,
    role,
    createdAt: authUser.created_at
  };
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signPayload(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createSessionToken(user) {
  const payload = base64UrlEncode({
    userId: user.id,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS
  });
  return `rf_${payload}.${signPayload(payload)}`;
}

function verifySessionToken(token, db) {
  if (!token?.startsWith("rf_")) return null;
  const [payloadPart, signature] = token.slice(3).split(".");
  if (!payloadPart || !signature || signature !== signPayload(payloadPart)) return null;
  const payload = base64UrlDecode(payloadPart);
  if (!payload.exp || payload.exp < Date.now()) return null;
  const user = db.users.find(item => item.id === payload.userId);
  return user || null;
}

function clean(value) {
  return String(value || "").trim();
}

function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    req.on("data", chunk => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_JSON_BYTES) {
        tooLarge = true;
        body = "";
        const error = new Error("Uploaded media is too large. Please use smaller/compressed images or fewer files.");
        error.statusCode = 413;
        reject(error);
      }
    });
    req.on("end", () => {
      if (tooLarge) return;
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function isPhone(value) {
  return /^[0-9+\-\s()]{7,18}$/.test(String(value || ""));
}

function discountedPrice(product) {
  if (Number(product.discountPrice) > 0) {
    return Math.round(Number(product.discountPrice));
  }
  return Math.round(product.price * (1 - (Number(product.discount) || 0) / 100));
}

function listFromValue(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value).split(",").map(clean).filter(Boolean);
}

function slugify(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || uid("product");
}

function supabaseEnabled() {
  return Boolean(supabase);
}

function supabaseWriteClient() {
  return supabaseAdmin;
}

function requireSupabaseAdminWrite() {
  if (!SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
    throw new Error("Supabase admin writes need SUPABASE_SERVICE_ROLE_KEY in the server environment, or migrate admin login to Supabase Auth and add the admin user to public.admin_users.");
  }
}

function toAppProduct(row) {
  const product = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    price: Number(row.price || 0),
    discountPrice: Number(row.discount_price || 0),
    discount: 0,
    stock: Number(row.stock || 0),
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    thumbnail: row.thumbnail_url || "",
    galleryImages: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    images: [row.thumbnail_url, ...(Array.isArray(row.gallery_urls) ? row.gallery_urls : [])].filter(Boolean),
    videoUrl: row.video_url || "",
    description: row.description || "",
    featured: Boolean(row.featured),
    status: row.active === false ? "inactive" : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  product.discount = product.discountPrice > 0 && product.price > 0 ? Math.max(0, Math.round((1 - product.discountPrice / product.price) * 100)) : 0;
  normalizeProduct(product);
  return product;
}

function toSupabaseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug || slugify(product.name),
    description: product.description,
    category: product.category,
    price: product.price,
    discount_price: product.discountPrice || 0,
    stock: product.stock,
    sizes: product.sizes,
    colors: product.colors,
    thumbnail_url: product.thumbnail,
    gallery_urls: product.galleryImages,
    video_url: product.videoUrl,
    featured: product.featured,
    active: product.status !== "inactive",
    updated_at: new Date().toISOString()
  };
}

async function supabaseProducts({ q = "", category = "", includeInactive = false } = {}) {
  const client = includeInactive ? supabaseWriteClient() : supabase;
  if (!client) throw new Error("Supabase is not configured.");
  let query = client.from("products").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("active", true);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase products read failed: ${error.message}`);
  const products = (data || []).map(toAppProduct);
  return { products, categories: [...new Set(products.map(item => item.category))] };
}

async function supabaseProductById(id, includeInactive = false) {
  const client = includeInactive ? supabaseWriteClient() : supabase;
  if (!client) throw new Error("Supabase is not configured.");
  let query = client.from("products").select("*").eq("id", id);
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Supabase product read failed: ${error.message}`);
  return data ? toAppProduct(data) : null;
}

async function supabaseCreateProduct(product) {
  requireSupabaseAdminWrite();
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const payload = toSupabaseProduct(product);
  const { data, error } = await client.from("products").insert(payload).select("*").single();
  if (error) throw new Error(`Supabase product insert failed: ${error.message}`);
  return toAppProduct(data);
}

async function supabaseUpdateProduct(id, product) {
  requireSupabaseAdminWrite();
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const payload = toSupabaseProduct({ ...product, id });
  delete payload.id;
  const { data, error } = await client.from("products").update(payload).eq("id", id).select("*").single();
  if (error) throw new Error(`Supabase product update failed: ${error.message}`);
  return toAppProduct(data);
}

async function supabaseDeleteProduct(id) {
  requireSupabaseAdminWrite();
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("products").delete().eq("id", id).select("*").single();
  if (error) throw new Error(`Supabase product delete failed: ${error.message}`);
  return toAppProduct(data);
}

function toAppSellerApplication(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    shopName: row.shop_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    category: row.product_category,
    website: row.website,
    message: row.message,
    status: row.status || "New",
    createdAt: row.created_at
  };
}

async function supabaseCreateSellerApplication(application) {
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("seller_applications").insert({
    id: application.id,
    full_name: application.fullName,
    shop_name: application.shopName,
    phone: application.phone,
    email: application.email,
    city: application.city,
    product_category: application.category,
    website: application.website,
    message: application.message,
    status: application.status
  }).select("*").single();
  if (error) throw new Error(`Supabase seller application insert failed: ${error.message}`);
  return toAppSellerApplication(data);
}

async function supabaseInsertOrder(order) {
  requireSupabaseAdminWrite();
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("orders").insert({
    id: order.id,
    user_id: order.userId,
    customer: order.customer,
    address: order.address,
    total: order.total,
    payment: order.payment,
    shipment: order.shipment,
    status: order.status
  }).select("*").single();
  if (error) throw new Error(`Supabase order insert failed: ${error.message}`);
  const rows = order.items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.name,
    price: item.price,
    quantity: item.qty,
    size: item.size,
    color: item.color,
    image_url: item.image
  }));
  const itemsResult = await client.from("order_items").insert(rows);
  if (itemsResult.error) throw new Error(`Supabase order items insert failed: ${itemsResult.error.message}`);
  return { ...order, createdAt: data.created_at, updatedAt: data.updated_at };
}

async function supabaseSettings(localSettings) {
  const { data, error } = await supabase.from("store_settings").select("section, values").order("section");
  if (error) throw new Error(`Supabase settings read failed: ${error.message}`);
  const settings = JSON.parse(JSON.stringify(localSettings || defaultSettings()));
  for (const row of data || []) {
    if (settings[row.section] && row.values && typeof row.values === "object") {
      settings[row.section] = mergeSection(settings[row.section], row.values);
    }
  }
  return settings;
}

async function supabaseSaveSettingsSection(section, values) {
  requireSupabaseAdminWrite();
  const client = supabaseWriteClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("store_settings").upsert({
    section,
    values,
    updated_at: new Date().toISOString()
  }, { onConflict: "section" });
  if (error) throw new Error(`Supabase settings update failed: ${error.message}`);
}

async function supabaseRoleForUser(authUser) {
  const client = supabaseWriteClient();
  if (!client || !authUser?.id) return "customer";
  const [roleResult, adminResult] = await Promise.all([
    client.from("user_roles").select("role").eq("user_id", authUser.id).maybeSingle(),
    client.from("admin_users").select("role,email").eq("user_id", authUser.id).maybeSingle()
  ]);
  if (roleResult.error && roleResult.error.code !== "42P01") {
    console.warn("Supabase user_roles lookup failed:", roleResult.error.message);
  }
  if (adminResult.error && adminResult.error.code !== "42P01") {
    console.warn("Supabase admin_users lookup failed:", adminResult.error.message);
  }
  const role = roleResult.data?.role || adminResult.data?.role || "customer";
  return role === "admin" ? "admin" : "customer";
}

async function supabaseEnsureProfile(authUser, role = "customer") {
  const client = supabaseWriteClient();
  if (!client || !authUser?.id) return;
  const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Customer";
  const profileResult = await client.from("profiles").upsert({
    id: authUser.id,
    full_name: fullName,
    email: authUser.email,
    updated_at: new Date().toISOString()
  }, { onConflict: "id" });
  if (profileResult.error && profileResult.error.code !== "42P01") {
    console.warn("Supabase profile upsert failed:", profileResult.error.message);
  }
  const roleResult = await client.from("user_roles").upsert({
    user_id: authUser.id,
    role,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (roleResult.error && roleResult.error.code !== "42P01") {
    console.warn("Supabase role upsert failed:", roleResult.error.message);
  }
}

async function supabaseSessionFromToken(accessToken, requiredRole = "") {
  if (!supabase || !accessToken) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw new Error(error?.message || "Supabase session could not be verified.");
  }
  const role = await supabaseRoleForUser(data.user);
  await supabaseEnsureProfile(data.user, role);
  if (requiredRole === "admin" && role !== "admin") {
    const err = new Error("This Google account is not authorized for admin access.");
    err.statusCode = 403;
    throw err;
  }
  return { token: accessToken, user: publicSupabaseUser(data.user, role), provider: "supabase" };
}

async function supabasePasswordAuth(email, password, mode = "login") {
  if (!supabase) throw new Error("Supabase Auth is not configured.");
  const authCall = mode === "signup"
    ? supabase.auth.signUp({ email, password })
    : supabase.auth.signInWithPassword({ email, password });
  const { data, error } = await authCall;
  if (error) throw new Error(error.message);
  if (!data.session?.access_token) {
    const err = new Error("Please confirm your email, then login again.");
    err.statusCode = 202;
    throw err;
  }
  const role = await supabaseRoleForUser(data.user);
  await supabaseEnsureProfile(data.user, role);
  return { token: data.session.access_token, user: publicSupabaseUser(data.user, role), provider: "supabase" };
}

function normalizeProduct(product) {
  let changed = false;
  if (!Array.isArray(product.images)) {
    product.images = listFromValue(product.images);
    changed = true;
  }
  if (!product.thumbnail) {
    product.thumbnail = product.images[0] || "";
    changed = true;
  }
  if (!Array.isArray(product.galleryImages)) {
    product.galleryImages = product.images.length ? product.images.slice(1) : [];
    changed = true;
  }
  const media = [product.thumbnail, ...product.galleryImages].filter(Boolean);
  if (media.length && JSON.stringify(product.images) !== JSON.stringify(media)) {
    product.images = media;
    changed = true;
  }
  if (!product.status) {
    product.status = "active";
    changed = true;
  }
  if (product.discountPrice === undefined) {
    product.discountPrice = discountedPrice(product);
    changed = true;
  }
  if (product.videoUrl === undefined) {
    product.videoUrl = "";
    changed = true;
  }
  return changed;
}

function productPayload(body, existing = {}) {
  const category = clean(body.category);
  const thumbnail = clean(body.thumbnail) || clean(body.mainImage) || (Array.isArray(body.images) ? clean(body.images[0]) : clean(body.images).split(",").map(clean).filter(Boolean)[0]);
  const galleryImages = listFromValue(body.galleryImages || body.images).filter(image => image !== thumbnail);
  const discountPrice = Number(body.discountPrice || 0);
  const product = {
    ...existing,
    name: clean(body.name),
    category,
    price: Number(body.price),
    discountPrice,
    discount: discountPrice > 0 && Number(body.price) > 0 ? Math.max(0, Math.round((1 - discountPrice / Number(body.price)) * 100)) : Number(body.discount || 0),
    stock: Number(body.stock),
    sizes: listFromValue(body.sizes),
    colors: listFromValue(body.colors),
    thumbnail,
    galleryImages,
    images: [thumbnail, ...galleryImages].filter(Boolean),
    videoUrl: clean(body.videoUrl),
    description: clean(body.description),
    featured: Boolean(body.featured),
    status: clean(body.status) === "inactive" ? "inactive" : "active",
    updatedAt: new Date().toISOString()
  };
  const errors = [];
  if (!product.name) errors.push("Product name is required.");
  if (!product.category) errors.push("Category is required.");
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push("Valid price is required.");
  if (!Number.isFinite(product.stock) || product.stock < 0) errors.push("Valid stock is required.");
  if (!product.sizes.length) errors.push("At least one size is required.");
  if (!product.colors.length) errors.push("At least one color is required.");
  if (!product.description) errors.push("Description is required.");
  return { product, errors };
}

async function getAuth(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? clean(header.slice(7)) : "";
  if (!token || token === "null" || token === "undefined" || token === "false") return null;
  const signedUser = verifySessionToken(token, db);
  if (signedUser) return signedUser;
  const now = Date.now();
  db.sessions = db.sessions.filter(session => new Date(session.expiresAt).getTime() > now);
  const session = db.sessions.find(item => item.token === token);
  const user = session ? db.users.find(item => item.id === session.userId) : null;
  if (user) return user;
  if (supabaseEnabled()) {
    try {
      const verified = await supabaseSessionFromToken(token);
      return verified.user;
    } catch (error) {
      if (!/invalid jwt|unable to parse|jwt malformed/i.test(error.message)) {
        console.warn("Supabase token verification failed:", error.message);
      }
    }
  }
  return null;
}

async function requireAuth(req, res, db) {
  const user = await getAuth(req, db);
  if (!user) {
    sendError(res, 401, "Please login to continue.");
    return null;
  }
  return user;
}

async function requireAdmin(req, res, db) {
  const user = await requireAuth(req, res, db);
  if (!user) return null;
  if (user.role !== "admin") {
    sendError(res, 403, "Admin access required.");
    return null;
  }
  return user;
}

async function handleApi(req, res, url) {
  const db = readDb();
  const method = req.method;
  const pathname = url.pathname;

  try {
    if (method === "GET" && pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        supabaseConfigured: supabaseEnabled(),
        supabaseServiceRoleConfigured: Boolean(SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin),
        supabaseConfigErrors,
        runtime: process.env.VERCEL ? "vercel" : "node"
      });
    }

    if (method === "GET" && pathname === "/api/settings") {
      if (supabaseEnabled()) {
        const settings = await supabaseSettings(db.settings);
        return sendJson(res, 200, { settings: sanitizeSettings(settings) });
      }
      return sendJson(res, 200, { settings: sanitizeSettings(db.settings) });
    }

    if (method === "GET" && pathname === "/api/auth/config") {
      const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
      return sendJson(res, 200, {
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        googleEnabled: supabaseEnabled(),
        redirectBase: process.env.PUBLIC_SITE_URL || vercelUrl
      });
    }

    if (method === "GET" && pathname === "/api/products") {
      const q = clean(url.searchParams.get("q")).toLowerCase();
      const category = clean(url.searchParams.get("category"));
      if (supabaseEnabled()) {
        const payload = await supabaseProducts({ q, category, includeInactive: false });
        return sendJson(res, 200, payload);
      }
      let products = db.products;
      products.forEach(normalizeProduct);
      products = products.filter(product => product.status !== "inactive");
      if (q) {
        products = products.filter(product =>
          [product.name, product.category, product.description].join(" ").toLowerCase().includes(q)
        );
      }
      if (category) {
        products = products.filter(product => product.category === category);
      }
      return sendJson(res, 200, { products, categories: [...new Set(db.products.map(item => item.category))] });
    }

    if (method === "GET" && pathname.startsWith("/api/products/")) {
      const id = decodeURIComponent(pathname.split("/").pop());
      if (supabaseEnabled()) {
        const product = await supabaseProductById(id, false);
        return product ? sendJson(res, 200, { product }) : sendError(res, 404, "Product not found.");
      }
      const product = db.products.find(item => item.id === id);
      if (product) normalizeProduct(product);
      return product ? sendJson(res, 200, { product }) : sendError(res, 404, "Product not found.");
    }

    if (method === "POST" && pathname === "/api/auth/signup") {
      const body = await parseJson(req);
      const errors = [];
      if (!clean(body.fullName)) errors.push("Full name is required.");
      if (!isEmail(body.email)) errors.push("Valid email is required.");
      if (clean(body.password).length < 6) errors.push("Password must be at least 6 characters.");
      if (db.users.some(user => user.email === clean(body.email).toLowerCase())) errors.push("Email is already registered.");
      if (errors.length) return sendJson(res, 400, { errors });
      if (supabaseEnabled()) {
        try {
          const session = await supabasePasswordAuth(clean(body.email).toLowerCase(), clean(body.password), "signup");
          return sendJson(res, 201, session);
        } catch (error) {
          if (error.statusCode === 202) return sendJson(res, 202, { message: error.message });
          console.warn("Supabase signup failed, using local fallback:", error.message);
        }
      }
      const user = createUserRecord(body);
      db.users.push(user);
      const token = createSessionToken(user);
      db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
      writeDb(db);
      return sendJson(res, 201, { token, user: publicUser(user) });
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const body = await parseJson(req);
      if (supabaseEnabled()) {
        try {
          const session = await supabasePasswordAuth(clean(body.email).toLowerCase(), clean(body.password), "login");
          logLogin(db, session.user.email, "success", req);
          writeDb(db);
          return sendJson(res, 200, session);
        } catch (error) {
          const expected = /invalid login credentials|email not confirmed/i.test(error.message);
          if (!expected) console.warn("Supabase password login failed:", error.message);
        }
      }
      const user = db.users.find(item => item.email === clean(body.email).toLowerCase());
      if (!user || !verifyPassword(clean(body.password), user.passwordHash)) {
        logLogin(db, body.email, "failed", req);
        writeDb(db);
        return sendError(res, 401, "Invalid email or password.");
      }
      const token = createSessionToken(user);
      db.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
      logLogin(db, user.email, "success", req);
      writeDb(db);
      return sendJson(res, 200, { token, user: publicUser(user) });
    }

    if (method === "POST" && pathname === "/api/auth/supabase") {
      const body = await parseJson(req);
      const accessToken = clean(body.accessToken);
      const requiredRole = clean(body.role);
      const session = await supabaseSessionFromToken(accessToken, requiredRole);
      logLogin(db, session.user.email, "success", req);
      writeDb(db);
      return sendJson(res, 200, session);
    }

    if (method === "POST" && pathname === "/api/auth/logout") {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      db.sessions = db.sessions.filter(session => session.token !== token);
      writeDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (method === "GET" && (pathname === "/api/me" || pathname === "/api/auth/me")) {
      const user = await requireAuth(req, res, db);
      if (!user) return;
      writeDb(db);
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (method === "GET" && pathname === "/api/orders") {
      const user = await requireAuth(req, res, db);
      if (!user) return;
      writeDb(db);
      const orders = user.role === "admin" ? db.orders : db.orders.filter(order => order.userId === user.id);
      return sendJson(res, 200, { orders });
    }

    if (method === "POST" && pathname === "/api/orders") {
      const user = await requireAuth(req, res, db);
      if (!user) return;
      const body = await parseJson(req);
      const errors = [];
      const items = Array.isArray(body.items) ? body.items : [];
      const address = body.address || {};
      if (!items.length) errors.push("Cart is empty.");
      if (!clean(address.fullName)) errors.push("Delivery name is required.");
      if (!isPhone(address.phone)) errors.push("Valid phone number is required.");
      if (!clean(address.addressLine)) errors.push("Address is required.");
      if (!clean(address.city)) errors.push("City is required.");
      const orderItems = [];
      for (const item of items) {
        const product = supabaseEnabled()
          ? await supabaseProductById(item.productId, false)
          : db.products.find(productItem => productItem.id === item.productId);
        const qty = Number(item.qty);
        if (!product || !Number.isFinite(qty) || qty < 1) {
          errors.push("Invalid cart item.");
          continue;
        }
        if (product.stock < qty) {
          errors.push(`${product.name} has only ${product.stock} in stock.`);
          continue;
        }
        const size = clean(item.size);
        if (!size) {
          errors.push("Please select a size.");
          continue;
        }
        if (!product.sizes.includes(size)) {
          errors.push(`Selected size is not available for ${product.name}.`);
          continue;
        }
        orderItems.push({
          productId: product.id,
          name: product.name,
          price: discountedPrice(product),
          qty,
          size,
          color: clean(item.color) || product.colors[0],
          image: product.images[0]
        });
      }
      if (errors.length) return sendJson(res, 400, { errors });
      if (!supabaseEnabled()) {
        orderItems.forEach(item => {
          const product = db.products.find(productItem => productItem.id === item.productId);
          product.stock -= item.qty;
        });
      }
      const order = {
        id: uid("ord"),
        userId: user.id,
        customer: publicUser(user),
        items: orderItems,
        address: {
          fullName: clean(address.fullName),
          phone: clean(address.phone),
          addressLine: clean(address.addressLine),
          city: clean(address.city),
          note: clean(address.note)
        },
        total: orderItems.reduce((sum, item) => sum + item.price * item.qty, 0),
        payment: {
          method: clean(body.paymentMethod) || "cod",
          status: clean(body.paymentMethod) === "razorpay" ? "Pending" : "COD"
        },
        shipment: {
          provider: "",
          trackingId: "",
          awb: "",
          status: "Pending",
          labelUrl: ""
        },
        status: "Placed",
        createdAt: new Date().toISOString()
      };
      createLocalShipment(db, order);
      if (supabaseEnabled()) {
        const savedOrder = await supabaseInsertOrder(order);
        db.orders.unshift(savedOrder);
        writeDb(db);
        return sendJson(res, 201, { order: savedOrder });
      }
      db.orders.unshift(order);
      writeDb(db);
      return sendJson(res, 201, { order });
    }

    if (method === "POST" && pathname === "/api/seller-applications") {
      const body = await parseJson(req);
      const errors = [];
      if (!clean(body.fullName)) errors.push("Full name is required.");
      if (!clean(body.shopName)) errors.push("Brand or shop name is required.");
      if (!isPhone(body.phone)) errors.push("Valid phone number is required.");
      if (!isEmail(body.email)) errors.push("Valid email is required.");
      if (!clean(body.city)) errors.push("City is required.");
      if (!clean(body.category)) errors.push("Product category is required.");
      if (!clean(body.message)) errors.push("Short message is required.");
      if (errors.length) return sendJson(res, 400, { errors });
      const application = {
        id: uid("sel"),
        fullName: clean(body.fullName),
        shopName: clean(body.shopName),
        phone: clean(body.phone),
        email: clean(body.email).toLowerCase(),
        city: clean(body.city),
        category: clean(body.category),
        website: clean(body.website),
        message: clean(body.message),
        status: "New",
        createdAt: new Date().toISOString()
      };
      if (supabaseEnabled()) {
        const savedApplication = await supabaseCreateSellerApplication(application);
        db.sellerApplications.unshift(savedApplication);
        writeDb(db);
        return sendJson(res, 201, { message: "Thank you. Our team will contact you shortly.", application: savedApplication });
      }
      db.sellerApplications.unshift(application);
      writeDb(db);
      return sendJson(res, 201, { message: "Thank you. Our team will contact you shortly.", application });
    }

    if (method === "POST" && pathname === "/api/payments/razorpay/order") {
      const user = await requireAuth(req, res, db);
      if (!user) return;
      const body = await parseJson(req);
      const amount = Number(body.amount);
      if (!db.settings.payment.razorpayEnabled) return sendError(res, 400, "Razorpay is disabled.");
      if (!Number.isFinite(amount) || amount <= 0) return sendError(res, 400, "Valid payment amount is required.");
      const paymentOrder = {
        id: uid("rzp_order"),
        provider: "razorpay",
        userId: user.id,
        amount,
        currency: db.settings.general.currency || "INR",
        status: "created",
        receipt: clean(body.receipt) || uid("receipt"),
        createdAt: new Date().toISOString()
      };
      db.payments.unshift(paymentOrder);
      writeDb(db);
      return sendJson(res, 201, { order: paymentOrder, keyId: db.settings.payment.razorpayKeyId, mode: db.settings.payment.paymentMode });
    }

    if (method === "POST" && pathname === "/api/payments/razorpay/verify") {
      const user = await requireAuth(req, res, db);
      if (!user) return;
      const body = await parseJson(req);
      const payload = `${clean(body.razorpay_order_id)}|${clean(body.razorpay_payment_id)}`;
      const ok = verifyHmacSignature(payload, clean(body.razorpay_signature), db.settings.payment.razorpayKeySecret);
      db.integrationLogs.unshift({
        id: uid("log"),
        type: "razorpay",
        status: ok ? "success" : "failure",
        message: ok ? "Customer payment signature verified." : "Customer payment signature verification failed.",
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      return ok ? sendJson(res, 200, { ok: true, message: db.settings.payment.successMessage }) : sendError(res, 400, db.settings.payment.failureMessage);
    }

    if (pathname.startsWith("/api/admin")) {
      const admin = await requireAdmin(req, res, db);
      if (!admin) return;

      if (method === "GET" && pathname === "/api/admin/summary") {
        if (supabaseEnabled()) {
          const client = supabaseWriteClient();
          if (!client) throw new Error("Supabase is not configured.");
          const [productsResult, ordersResult, applicationsResult] = await Promise.all([
            client.from("products").select("id", { count: "exact", head: true }),
            client.from("orders").select("id", { count: "exact", head: true }),
            client.from("seller_applications").select("*").order("created_at", { ascending: false })
          ]);
          if (productsResult.error) throw new Error(`Supabase product count failed: ${productsResult.error.message}`);
          if (ordersResult.error) throw new Error(`Supabase order count failed: ${ordersResult.error.message}`);
          if (applicationsResult.error) throw new Error(`Supabase seller applications read failed: ${applicationsResult.error.message}`);
          return sendJson(res, 200, {
            totals: {
              products: productsResult.count || 0,
              orders: ordersResult.count || 0,
              users: db.users.filter(user => user.role === "customer").length,
              sellerApplications: applicationsResult.data.length
            },
            recentOrders: db.orders.slice(0, 5),
            sellerApplications: applicationsResult.data.map(toAppSellerApplication)
          });
        }
        db.products.forEach(normalizeProduct);
        writeDb(db);
        return sendJson(res, 200, {
          totals: {
            products: db.products.length,
            orders: db.orders.length,
            users: db.users.filter(user => user.role === "customer").length,
            sellerApplications: db.sellerApplications.length
          },
          recentOrders: db.orders.slice(0, 5),
          sellerApplications: db.sellerApplications
        });
      }

      if (method === "GET" && pathname === "/api/admin/products") {
        if (supabaseEnabled()) {
          const payload = await supabaseProducts({ includeInactive: true });
          return sendJson(res, 200, payload);
        }
        db.products.forEach(normalizeProduct);
        writeDb(db);
        return sendJson(res, 200, { products: db.products, categories: [...new Set(db.products.map(item => item.category))] });
      }

      if (method === "GET" && pathname === "/api/admin/settings") {
        if (supabaseEnabled()) {
          const settings = await supabaseSettings(db.settings);
          return sendJson(res, 200, { settings: sanitizeSettings(settings, true) });
        }
        writeDb(db);
        return sendJson(res, 200, { settings: sanitizeSettings(db.settings, true) });
      }

      if (method === "PUT" && pathname.startsWith("/api/admin/settings/")) {
        const section = decodeURIComponent(pathname.split("/").pop());
        if (!db.settings[section]) return sendError(res, 404, "Settings section not found.");
        const body = await parseJson(req);
        db.settings[section] = mergeSection(db.settings[section], body);
        db.settings[section].updatedAt = new Date().toISOString();
        if (supabaseEnabled()) {
          await supabaseSaveSettingsSection(section, db.settings[section]);
        }
        writeDb(db);
        return sendJson(res, 200, { settings: sanitizeSettings(db.settings, true) });
      }

      if (method === "POST" && pathname === "/api/admin/security/password") {
        const body = await parseJson(req);
        if (!verifyPassword(clean(body.currentPassword), admin.passwordHash)) return sendError(res, 400, "Current password is incorrect.");
        if (clean(body.newPassword).length < 8) return sendError(res, 400, "New password must be at least 8 characters.");
        admin.passwordHash = hashPassword(clean(body.newPassword));
        db.sessions = db.sessions.filter(session => session.userId !== admin.id);
        writeDb(db);
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && pathname === "/api/admin/payments/razorpay/order") {
        const body = await parseJson(req);
        const amount = Number(body.amount);
        if (!db.settings.payment.razorpayEnabled) return sendError(res, 400, "Razorpay is disabled.");
        if (!Number.isFinite(amount) || amount <= 0) return sendError(res, 400, "Valid payment amount is required.");
        const paymentOrder = {
          id: uid("rzp_order"),
          provider: "razorpay",
          amount,
          currency: db.settings.general.currency || "INR",
          status: "created",
          receipt: clean(body.receipt) || uid("receipt"),
          createdAt: new Date().toISOString()
        };
        db.payments.unshift(paymentOrder);
        writeDb(db);
        return sendJson(res, 201, { order: paymentOrder, keyId: db.settings.payment.razorpayKeyId, mode: db.settings.payment.paymentMode });
      }

      if (method === "POST" && pathname === "/api/admin/payments/razorpay/verify") {
        const body = await parseJson(req);
        const payload = `${clean(body.razorpay_order_id)}|${clean(body.razorpay_payment_id)}`;
        const ok = verifyHmacSignature(payload, clean(body.razorpay_signature), db.settings.payment.razorpayKeySecret);
        db.integrationLogs.unshift({
          id: uid("log"),
          type: "razorpay",
          status: ok ? "success" : "failure",
          message: ok ? "Payment signature verified." : "Payment signature verification failed.",
          createdAt: new Date().toISOString()
        });
        writeDb(db);
        return ok ? sendJson(res, 200, { ok: true }) : sendError(res, 400, "Invalid payment signature.");
      }

      if (method === "POST" && pathname === "/api/admin/shiprocket/sync") {
        const body = await parseJson(req);
        const order = db.orders.find(item => item.id === clean(body.orderId));
        if (!order) return sendError(res, 404, "Order not found.");
        const shipment = createLocalShipment(db, order) || order.shipment;
        writeDb(db);
        return sendJson(res, 200, { shipment });
      }

      if (method === "POST" && pathname === "/api/admin/products") {
        const body = await parseJson(req);
        const { product, errors } = productPayload(body);
        if (errors.length) return sendJson(res, 400, { errors });
        product.id = uid("prod");
        product.slug = slugify(product.name);
        product.createdAt = new Date().toISOString();
        if (supabaseEnabled()) {
          const saved = await supabaseCreateProduct(product);
          return sendJson(res, 201, { product: saved });
        }
        db.products.unshift(product);
        writeDb(db);
        return sendJson(res, 201, { product });
      }

      if ((method === "PUT" || method === "DELETE") && pathname.startsWith("/api/admin/products/")) {
        const id = decodeURIComponent(pathname.split("/").pop());
        if (supabaseEnabled()) {
          const existing = await supabaseProductById(id, true);
          if (!existing) return sendError(res, 404, "Product not found.");
          if (method === "DELETE") {
            const removed = await supabaseDeleteProduct(id);
            return sendJson(res, 200, { product: removed });
          }
          const body = await parseJson(req);
          const { product, errors } = productPayload(body, existing);
          if (errors.length) return sendJson(res, 400, { errors });
          const saved = await supabaseUpdateProduct(id, product);
          return sendJson(res, 200, { product: saved });
        }
        const index = db.products.findIndex(product => product.id === id);
        if (index === -1) return sendError(res, 404, "Product not found.");
        if (method === "DELETE") {
          const [removed] = db.products.splice(index, 1);
          writeDb(db);
          return sendJson(res, 200, { product: removed });
        }
        const body = await parseJson(req);
        const { product, errors } = productPayload(body, db.products[index]);
        if (errors.length) return sendJson(res, 400, { errors });
        db.products[index] = product;
        writeDb(db);
        return sendJson(res, 200, { product });
      }

      if (method === "GET" && pathname === "/api/admin/users") {
        writeDb(db);
        return sendJson(res, 200, { users: db.users.map(publicUser) });
      }

      if (method === "PATCH" && pathname.startsWith("/api/admin/orders/")) {
        const id = decodeURIComponent(pathname.split("/").pop());
        const body = await parseJson(req);
        const order = db.orders.find(item => item.id === id);
        const allowed = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];
        if (!order) return sendError(res, 404, "Order not found.");
        if (!allowed.includes(body.status)) return sendError(res, 400, "Invalid order status.");
        order.status = body.status;
        order.updatedAt = new Date().toISOString();
        writeDb(db);
        return sendJson(res, 200, { order });
      }
    }

    if (method === "POST" && pathname === "/api/webhooks/razorpay") {
      const body = await parseJson(req);
      const signature = req.headers["x-razorpay-signature"];
      const ok = verifyHmacSignature(JSON.stringify(body), signature, db.settings.payment.razorpayWebhookSecret);
      db.integrationLogs.unshift({
        id: uid("log"),
        type: "razorpay-webhook",
        status: ok ? "success" : "failure",
        message: ok ? `Webhook accepted: ${body.event || "event"}` : "Webhook signature verification failed.",
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      return ok ? sendJson(res, 200, { ok: true }) : sendError(res, 400, "Invalid webhook signature.");
    }

    return sendError(res, 404, "API route not found.");
  } catch (error) {
    console.error(`[API ERROR] ${method} ${pathname}:`, error.message || error);
    return sendError(res, error.statusCode || 400, error.message || "Request failed.");
  }
}

function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }
  const ext = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": [".html", ".js", ".css"].includes(ext) ? "no-cache" : "public, max-age=3600"
  });
  fs.createReadStream(filePath).pipe(res);
}

ensureDb();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(req, res, url);
});

function appHandler(req, res) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `https://${host}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(req, res, url);
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Rukhsar Fashion running at http://localhost:${PORT}`);
  });
}

module.exports = { server, appHandler, handleApi, serveStatic, DB_FILE, readDb, writeDb };
