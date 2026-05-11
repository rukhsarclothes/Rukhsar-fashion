const state = {
  products: [],
  categories: [],
  user: JSON.parse(localStorage.getItem("rf_user") || "null"),
  token: sanitizeToken(localStorage.getItem("rf_token")),
  cart: JSON.parse(localStorage.getItem("rf_cart") || "[]"),
  adminTab: "dashboard",
  adminSearch: "",
  adminCategory: "",
  adminPage: 1,
  editingProduct: null,
  deleteProductId: null,
  settings: null,
  settingsTab: "general",
  authConfig: null,
  adminCache: null,
  adminVerifiedAt: 0
};

const DEBUG_API = false;

function sanitizeToken(value) {
  const token = String(value || "").trim();
  if (!token || token === "null" || token === "undefined" || token === "false" || token === "Bearer") return "";
  return token;
}

function hasValidToken() {
  state.token = sanitizeToken(state.token);
  if (!state.token) localStorage.removeItem("rf_token");
  return Boolean(state.token);
}

const categoryLabels = {
  chikankari: "Chikankari Collection"
};

const adminCategories = [
  ["chikankari", "Chikankari Collection"],
  ["Kurta Sets", "Kurta Sets"],
  ["Sarees", "Sarees"],
  ["Dresses", "Dresses"],
  ["Co-ord Sets", "Co-ord Sets"],
  ["Tunics", "Tunics"]
];

const app = document.querySelector("#app");
const cartCount = document.querySelector("#cartCount");
const toastEl = document.querySelector("#toast");
const mobileNav = document.querySelector("#mobileNav");
const adminNavLinks = document.querySelectorAll(".admin-nav-link");
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1200' viewBox='0 0 900 1200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%2315091d'/%3E%3Cstop offset='1' stop-color='%2324102f'/%3E%3C/linearGradient%3E%3Cpattern id='p' width='90' height='90' patternUnits='userSpaceOnUse'%3E%3Cpath d='M45 0 90 45 45 90 0 45Z' fill='none' stroke='%23d7b56d' stroke-opacity='.28' stroke-width='2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='900' height='1200' fill='url(%23g)'/%3E%3Crect width='900' height='1200' fill='url(%23p)' opacity='.5'/%3E%3Crect x='70' y='70' width='760' height='1060' rx='36' fill='none' stroke='%23d7b56d' stroke-opacity='.55' stroke-width='3'/%3E%3Ctext x='450' y='590' text-anchor='middle' fill='%23f2d993' font-family='Georgia,serif' font-size='54'%3ERukhsar%3C/text%3E%3Ctext x='450' y='655' text-anchor='middle' fill='%23fff6df' fill-opacity='.76' font-family='Arial,sans-serif' font-size='28'%3EFashion%3C/text%3E%3C/svg%3E";
window.RF_FALLBACK_IMAGE = FALLBACK_IMAGE;

document.querySelector("#menuButton").addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});

window.addEventListener("hashchange", route);
window.addEventListener("popstate", route);
document.addEventListener("click", event => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  handlers[action.dataset.action]?.(event, action);
});
document.addEventListener("change", event => {
  if (event.target.matches('.drop-zone input[type="file"]')) {
    handleMediaFiles(event.target, event.target.closest(".drop-zone").dataset.kind);
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action) return;
  handlers[action.dataset.action]?.(event, action);
});
document.addEventListener("input", event => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "admin-search") handlers[action.dataset.action]?.(event, action);
  if (action.dataset.action === "media-url-input") handlers[action.dataset.action]?.(event, action);
});
document.addEventListener("dragover", event => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) return;
  event.preventDefault();
  zone.classList.add("dragging");
});
document.addEventListener("dragleave", event => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) return;
  zone.classList.remove("dragging");
});
document.addEventListener("drop", event => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove("dragging");
  const input = zone.querySelector('input[type="file"]');
  input.files = event.dataTransfer.files;
  handleMediaFiles(input, zone.dataset.kind);
});
document.addEventListener("submit", event => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const handler = formHandlers[form.dataset.form];
  if (!handler) return;
  Promise.resolve(handler(form)).catch(error => showFormMessage(form, error.message, "error"));
});

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function categoryLabel(category) {
  return categoryLabels[category] || category;
}

function navigate(path) {
  history.pushState({}, "", path);
  route();
}

function discountPrice(product) {
  if (Number(product.discountPrice) > 0) return Math.round(Number(product.discountPrice));
  return Math.round(product.price * (1 - Number(product.discount || 0) / 100));
}

function productImage(product) {
  return firstMedia([product?.thumbnail, ...(product?.images || []), ...(product?.galleryImages || [])]) || FALLBACK_IMAGE;
}

function productGallery(product) {
  const gallery = [product.thumbnail, ...(product.galleryImages || []), ...(product.images || [])]
    .map(cleanMedia)
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
  return gallery.length ? gallery : [FALLBACK_IMAGE];
}

function cleanMedia(value) {
  const item = String(value || "").trim();
  if (!item || item === "undefined" || item === "null") return "";
  return item;
}

function firstMedia(items) {
  return (items || []).map(cleanMedia).find(Boolean) || "";
}

function imageTag(src, alt, className = "", attrs = "") {
  const safeSrc = cleanMedia(src) || FALLBACK_IMAGE;
  const classAttr = className ? ` class="${className}"` : "";
  return `<img${classAttr} src="${safeSrc}" alt="${alt}" ${attrs} onerror="this.onerror=null;this.src=window.RF_FALLBACK_IMAGE">`;
}

function isActiveProduct(product) {
  return product.status !== "inactive";
}

function productDiscountPercent(product) {
  if (Number(product.price) <= 0) return 0;
  return Math.max(0, Math.round((1 - discountPrice(product) / Number(product.price)) * 100));
}

function videoMarkup(url) {
  if (!url) return "";
  if (url.startsWith("data:video") || /\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return `<video src="${url}" controls preload="metadata"></video>`;
  }
  return `<a class="btn secondary" href="${url}" target="_blank" rel="noreferrer">Open Video</a>`;
}

function saveSession(payload) {
  state.token = sanitizeToken(payload.token);
  state.user = payload.user;
  if (!state.token || !state.user) throw new Error("Login did not return a valid session.");
  localStorage.setItem("rf_token", state.token);
  localStorage.setItem("rf_user", JSON.stringify(state.user));
  updateAdminVisibility(state.user.role === "admin");
}

function clearSession() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("rf_token");
  localStorage.removeItem("rf_user");
  sessionStorage.removeItem("rf_oauth_role");
  updateAdminVisibility(false);
}

function saveCart() {
  localStorage.setItem("rf_cart", JSON.stringify(state.cart));
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function showFormMessage(form, message, type = "success") {
  form.parentElement?.querySelectorAll(".message.form-message").forEach(node => node.remove());
  form.insertAdjacentHTML("beforebegin", `<div class="message form-message ${type}">${message}</div>`);
}

function updateAdminVisibility(isAdmin = false) {
  adminNavLinks.forEach(link => {
    link.hidden = !isAdmin;
    link.classList.toggle("verified-admin", isAdmin);
  });
}

function setButtonLoading(form, isLoading, label = "Please wait...") {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

async function api(path, options = {}) {
  const url = new URL(path, window.location.origin).toString();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (hasValidToken()) headers.Authorization = `Bearer ${state.token}`;
  else delete headers.Authorization;
  if (DEBUG_API) console.info(`[API] ${options.method || "GET"} ${url}`);
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    console.error(`[API NETWORK ERROR] ${options.method || "GET"} ${url}`, error);
    throw new Error(`Could not reach the server while calling ${url}. Please confirm the local server is running and try again.`);
  }
  const payload = await response.json().catch(() => ({}));
  if (DEBUG_API) console.info(`[API] ${response.status} ${url}`, payload);
  if (!response.ok) {
    const message = payload.error || (payload.errors || ["Something went wrong."]).join(" ");
    throw new Error(message);
  }
  return payload;
}

async function loadAuthConfig() {
  if (!state.authConfig) state.authConfig = await api("/api/auth/config");
  return state.authConfig;
}

async function startGoogleLogin(role = "customer") {
  const config = await loadAuthConfig();
  if (!config.googleEnabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Google login is not configured yet.");
  }
  sessionStorage.setItem("rf_oauth_role", role);
  const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo
  });
  window.location.href = `${config.supabaseUrl}/auth/v1/authorize?${params.toString()}`;
}

async function processAuthCallback() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hasAuthHash = hash.has("access_token") || hash.has("error") || location.pathname === "/auth/callback";
  if (!hasAuthHash) return false;
  const role = new URLSearchParams(location.search).get("role") || sessionStorage.getItem("rf_oauth_role") || "customer";
  if (hash.has("error")) {
    const message = hash.get("error_description") || hash.get("error") || "Google login failed.";
    history.replaceState({}, "", role === "admin" ? "/admin" : "#/login");
    shell(`<div><div class="eyebrow">Login</div><h2>Authentication failed</h2></div>`, `<div class="message error">${decodeURIComponent(message)}</div>`);
    return true;
  }
  const accessToken = hash.get("access_token");
  if (!accessToken) return false;
  try {
    const session = await api("/api/auth/supabase", {
      method: "POST",
      body: JSON.stringify({ accessToken, role: role === "admin" ? "admin" : "" })
    });
    saveSession(session);
    sessionStorage.removeItem("rf_oauth_role");
    history.replaceState({}, "", role === "admin" ? "/admin/dashboard" : "#/");
    await route();
  } catch (error) {
    clearSession();
    history.replaceState({}, "", role === "admin" ? "/admin" : "#/login");
    shell(`<div><div class="eyebrow">Login</div><h2>Authentication failed</h2></div>`, `<div class="message error">${error.message}</div>`);
  }
  return true;
}

async function verifyCurrentSession(requiredRole = "") {
  if (!hasValidToken()) {
    clearSession();
    return null;
  }
  try {
    const payload = await api("/api/auth/me");
    if (!payload.loggedIn || !payload.user) {
      clearSession();
      return null;
    }
    const { user } = payload;
    state.user = user;
    localStorage.setItem("rf_user", JSON.stringify(user));
    updateAdminVisibility(Boolean(payload.isAdmin));
    if (payload.isAdmin) state.adminVerifiedAt = Date.now();
    if (requiredRole && user.role !== requiredRole) {
      throw new Error(requiredRole === "admin" ? "This account is not admin." : "Access denied.");
    }
    return user;
  } catch (error) {
    clearSession();
    if (/login|session|jwt|token|unauthorized/i.test(error.message)) {
      throw new Error("Session expired, please login again.");
    }
    throw error;
  }
}

async function ensureAdminAccess() {
  const recentlyVerified = Date.now() - state.adminVerifiedAt < 60_000;
  if (recentlyVerified && state.user?.role === "admin" && hasValidToken()) return state.user;
  return verifyCurrentSession("admin");
}

async function loadAdminData(options = {}) {
  const { force = false, includeSettings = false, includeUsers = false } = options;
  if (force || !state.adminCache) {
    const [summary, products, orders] = await Promise.all([
      api("/api/admin/summary"),
      api("/api/admin/products"),
      api("/api/orders")
    ]);
    state.adminCache = {
      summary,
      products: products.products,
      orders: orders.orders,
      users: null,
      settings: null
    };
  }
  const requests = [];
  if (includeUsers && !state.adminCache.users) {
    requests.push(api("/api/admin/users").then(payload => {
      state.adminCache.users = payload.users;
    }));
  }
  if (includeSettings && !state.adminCache.settings) {
    requests.push(loadSettings(true).then(settings => {
      state.adminCache.settings = settings;
    }));
  }
  if (requests.length) await Promise.all(requests);
  return state.adminCache;
}

function invalidateAdminCache() {
  state.adminCache = null;
}

async function refreshVerifiedSession() {
  if (!hasValidToken()) {
    updateAdminVisibility(false);
    return null;
  }
  try {
    return await verifyCurrentSession();
  } catch (error) {
    updateAdminVisibility(false);
    return null;
  }
}

async function loadProducts(params = "") {
  const payload = await api(`/api/products${params}`);
  state.products = payload.products;
  state.categories = payload.categories;
  return payload;
}

async function loadSettings(admin = false) {
  const payload = await api(admin ? "/api/admin/settings" : "/api/settings");
  state.settings = payload.settings;
  applyPublicSettings(payload.settings);
  return payload.settings;
}

function applyPublicSettings(settings) {
  if (!settings) return;
  document.title = settings.seo?.metaTitle || settings.general?.storeName || "Rukhsar Fashion";
  document.querySelector('meta[name="description"]')?.setAttribute("content", settings.seo?.metaDescription || settings.general?.tagline || "");
  const primary = settings.branding?.primaryColor;
  const accent = settings.branding?.accentColor;
  const gold = settings.branding?.champagneColor;
  document.documentElement.style.setProperty("--mocha", primary || "#76564f");
  document.documentElement.style.setProperty("--rose", accent || "#c98c8c");
  document.documentElement.style.setProperty("--gold", gold || "#c8a76a");
  document.querySelector("#footerStoreName").textContent = settings.general?.storeName || "Rukhsar Fashion";
  document.querySelector("#footerTagline").textContent = settings.general?.tagline || "";
  const social = settings.social || {};
  document.querySelector("#socialLinks").innerHTML = Object.entries(social)
    .filter(([, url]) => url)
    .map(([name, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${name}</a>`)
    .join("");
}

function shell(title, body) {
  app.innerHTML = `<section class="page">${title ? `<div class="section-head"><div>${title}</div></div>` : ""}${body}</section>`;
  app.focus({ preventScroll: true });
}

function productCard(product) {
  const discount = productDiscountPercent(product);
  return `
    <article class="product-card">
      <button class="wishlist-btn" type="button" aria-label="Add ${product.name} to wishlist">♡</button>
      <a class="product-image-link" href="#/product/${product.id}">
        ${imageTag(productImage(product), product.name, "", 'loading="lazy"')}
      </a>
      <div class="product-body">
        <span class="pill">${categoryLabel(product.category)}</span>
        <h3><a href="#/product/${product.id}">${product.name}</a></h3>
        <div class="price-row">
          <span>${money(discountPrice(product))}</span>
          ${discountPrice(product) < product.price ? `<del>${money(product.price)}</del>` : ""}
          ${discount ? `<em>${discount}% off</em>` : ""}
        </div>
        <div class="size-list" aria-label="Available sizes">
          ${(product.sizes || []).map(size => `<span>${size}</span>`).join("")}
        </div>
        <a class="quick-view-btn" href="#/product/${product.id}">Add to Cart</a>
      </div>
    </article>
  `;
}

async function renderHome() {
  if (!state.settings) await loadSettings();
  await loadProducts();
  const activeProducts = state.products.filter(isActiveProduct);
  const featured = activeProducts.filter(product => product.featured).slice(0, 4);
  const chikankari = activeProducts.filter(product => product.category === "chikankari").slice(0, 4);
  const heroTitle = "Modern Royal Ethnic Wear";
  const heroSubtitle = "Luxury ethnic wear shaped with antique gold detail, graceful silhouettes, and celebration-ready ease.";
  const chikankariCopy = state.settings.homepage.chikankariCopy === "Timeless hand-embroidered elegance for every occasion." ? "Timeless hand embroidery crafted for modern elegance." : state.settings.homepage.chikankariCopy;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-ornament" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="eyebrow">Rukhsar Atelier</div>
        <h1>${heroTitle}</h1>
        <p>${heroSubtitle}</p>
        <div class="actions">
          <a class="btn" href="#/products">Explore Collection</a>
          <a class="btn champagne" href="/collections/chikankari">Signature Chikankari</a>
        </div>
      </div>
    </section>
    <section class="trust-strip" aria-label="Store promises">
      <div><strong>Premium Quality</strong><span>Selected fabrics</span></div>
      <div><strong>Expert Craftsmanship</strong><span>Ethnic detailing</span></div>
      <div><strong>Fast Shipping</strong><span>Quick dispatch</span></div>
      <div><strong>Secure Payment</strong><span>Protected checkout</span></div>
    </section>
    ${state.settings.homepage.featuredProductsEnabled ? `<section class="page">
      <div class="section-head">
        <div>
          <div class="eyebrow">Curated wardrobe</div>
          <h2>Featured pieces</h2>
        </div>
        <a href="#/products">View all</a>
      </div>
      <div class="grid product-grid">${featured.map(productCard).join("")}</div>
    </section>` : ""}
    ${state.settings.homepage.collectionSectionEnabled && state.settings.homepage.chikankariEnabled ? `<section class="collection-band">
      <div>
        <div class="eyebrow">Signature collection</div>
        <h2>Chikankari Collection</h2>
        <p>${chikankariCopy}</p>
      </div>
      <a class="btn" href="/collections/chikankari">Explore Chikankari</a>
    </section>
    <section class="page">
      <div class="grid product-grid">${chikankari.map(productCard).join("")}</div>
    </section>` : ""}
  `;
}

async function renderProducts(initialCategory = "") {
  const params = initialCategory ? `?category=${encodeURIComponent(initialCategory)}` : "";
  await loadProducts(params);
  const heading = initialCategory === "chikankari" ? "Chikankari Collection" : "Women's collection";
  const copy = initialCategory === "chikankari" ? "<p>Timeless hand-embroidered elegance for every occasion.</p>" : "";
  shell(`<div><div class="eyebrow">Shop</div><h2>${heading}</h2>${copy}</div>`, `
    <div class="toolbar">
      <input class="input" id="searchInput" type="search" placeholder="Search kurtas, sarees, dresses...">
      <select class="input" id="categoryFilter">
        <option value="">All categories</option>
        ${state.categories.map(category => `<option value="${category}" ${category === initialCategory ? "selected" : ""}>${categoryLabel(category)}</option>`).join("")}
      </select>
    </div>
    <div id="productResults" class="grid product-grid">${state.products.map(productCard).join("")}</div>
  `);
  const searchInput = document.querySelector("#searchInput");
  const categoryFilter = document.querySelector("#categoryFilter");
  const update = async () => {
    const params = new URLSearchParams();
    if (searchInput.value) params.set("q", searchInput.value);
    if (categoryFilter.value) params.set("category", categoryFilter.value);
    const payload = await loadProducts(`?${params.toString()}`);
    document.querySelector("#productResults").innerHTML = payload.products.length
      ? payload.products.map(productCard).join("")
      : `<div class="empty"><div><h3>No products found</h3><p>Try a different search or category.</p></div></div>`;
  };
  searchInput.addEventListener("input", debounce(update, 180));
  categoryFilter.addEventListener("change", update);
}

async function renderProductDetail(id) {
  const { product } = await api(`/api/products/${id}`);
  const gallery = productGallery(product);
  shell("", `
    <div class="detail-layout">
      <div class="product-media">
        ${imageTag(gallery[0], product.name, "detail-image", 'id="detailImage"')}
        <div class="media-thumbs">
          ${gallery.map((image, index) => `<button class="${index === 0 ? "active" : ""}" data-action="preview-media" data-src="${image}" aria-label="Preview product image ${index + 1}">${imageTag(image, "", "", 'loading="lazy"')}</button>`).join("")}
        </div>
        ${product.videoUrl ? `<div class="video-panel"><h3>Product video</h3>${videoMarkup(product.videoUrl)}</div>` : ""}
      </div>
      <aside class="panel">
        <span class="pill">${categoryLabel(product.category)}</span>
        <h1>${product.name}</h1>
        <div class="price-row">
          <span>${money(discountPrice(product))}</span>
          ${discountPrice(product) < product.price ? `<del>${money(product.price)}</del><span class="pill">${productDiscountPercent(product)}% off</span>` : ""}
        </div>
        <p>${product.description}</p>
        <form data-form="add-cart" class="form-grid">
          <input type="hidden" name="productId" value="${product.id}">
          <div class="field">
            <label for="size">Size</label>
            <select id="size" name="size">
              <option value="">Select a size</option>
              ${product.sizes.map(size => `<option>${size}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="color">Color</label>
            <select id="color" name="color">${product.colors.map(color => `<option>${color}</option>`).join("")}</select>
          </div>
          <button class="btn" type="submit"${product.stock < 1 ? " disabled" : ""}>${product.stock < 1 ? "Out of Stock" : "Add to Cart"}</button>
        </form>
      </aside>
    </div>
  `);
}

function renderCart() {
  const items = state.cart.map(cartItem => {
    const product = cartItem.product;
    return `
      <div class="cart-row">
        ${imageTag(productImage(product), product.name, "", 'loading="lazy"')}
        <div>
          <h3>${product.name}</h3>
          <p>Size ${cartItem.size} / ${cartItem.color}</p>
          <strong>${money(discountPrice(product) * cartItem.qty)}</strong>
        </div>
        <div class="qty" aria-label="Quantity controls">
          <button data-action="qty" data-id="${cartItem.key}" data-delta="-1" aria-label="Decrease quantity">-</button>
          <span>${cartItem.qty}</span>
          <button data-action="qty" data-id="${cartItem.key}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="icon-btn ghost" data-action="remove-cart" data-id="${cartItem.key}">Remove</button>
      </div>
    `;
  }).join("");
  const total = state.cart.reduce((sum, item) => sum + discountPrice(item.product) * item.qty, 0);
  shell(`<div><div class="eyebrow">Bag</div><h2>Your cart</h2></div>`, state.cart.length ? `
    <div class="checkout-layout">
      <div class="panel">${items}</div>
      <aside class="panel">
        <h3>Order summary</h3>
        <div class="option-row"><span>Subtotal</span><strong>${money(total)}</strong></div>
        <div class="option-row"><span>Delivery</span><strong>Free</strong></div>
        <div class="option-row"><span>Total</span><strong>${money(total)}</strong></div>
        <a class="btn" href="#/checkout">Checkout</a>
      </aside>
    </div>
  ` : `<div class="empty"><div><h3>Your cart is empty</h3><p>Explore the collection and add something lovely.</p><a class="btn" href="#/products">Shop Now</a></div></div>`);
}

async function renderCheckout() {
  if (!state.user) {
    location.hash = "#/login";
    return;
  }
  if (!state.settings) await loadSettings();
  const total = state.cart.reduce((sum, item) => sum + discountPrice(item.product) * item.qty, 0);
  const payment = state.settings?.payment || {};
  shell(`<div><div class="eyebrow">Checkout</div><h2>Delivery details</h2></div>`, state.cart.length ? `
    <div class="checkout-layout">
      <form data-form="checkout" class="panel form-grid">
        <div class="field"><label>Full name</label><input name="fullName" required value="${state.user.fullName}"></div>
        <div class="field"><label>Phone number</label><input name="phone" required></div>
        <div class="field"><label>Address</label><textarea name="addressLine" required></textarea></div>
        <div class="field"><label>City</label><input name="city" required></div>
        <div class="field"><label>Order note</label><input name="note"></div>
        <div class="field"><label>Payment method</label><select name="paymentMethod">
          ${payment.codEnabled !== false ? `<option value="cod">Cash on Delivery</option>` : ""}
          ${payment.razorpayEnabled ? `<option value="razorpay">Razorpay ${payment.paymentMode === "test" ? "(Test)" : ""}</option>` : ""}
        </select></div>
        <button class="btn" type="submit">Place Order</button>
      </form>
      <aside class="panel">
        <h3>Total</h3>
        <div class="option-row"><span>${state.cart.length} item(s)</span><strong>${money(total)}</strong></div>
        ${state.cart.map(item => `<div class="option-row"><span>${item.product.name}<br>Size ${item.size}</span><strong>x${item.qty}</strong></div>`).join("")}
      </aside>
    </div>
  ` : `<div class="empty"><h3>Your cart is empty.</h3></div>`);
}

function renderLogin(mode = "login") {
  const isSignup = mode === "signup";
  shell(`<div><div class="eyebrow">Account</div><h2>${isSignup ? "Create account" : "Welcome back"}</h2></div>`, `
    <form data-form="${isSignup ? "signup" : "login"}" class="panel form-grid">
      ${isSignup ? `<div class="field"><label>Full name</label><input name="fullName" required></div>` : ""}
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <div class="field"><label>Password</label><input type="password" name="password" required minlength="6"></div>
      <button class="btn" type="submit">${isSignup ? "Create Account" : "Login"}</button>
      <button class="btn ghost" type="button" data-action="oauth-login" data-role="customer">Continue with Google</button>
      <a href="#/${isSignup ? "login" : "signup"}">${isSignup ? "Already have an account?" : "New here? Create an account"}</a>
    </form>
  `);
}

function renderSeller() {
  shell(`<div><div class="eyebrow">Partner with us</div><h2>Sell With Us</h2><p>Share your brand details. Our team will review your application and contact you shortly.</p></div>`, `
    <form data-form="seller" class="panel form-grid two">
      <div class="field"><label>Full name</label><input name="fullName" required></div>
      <div class="field"><label>Brand / shop name</label><input name="shopName" required></div>
      <div class="field"><label>Phone number</label><input name="phone" required></div>
      <div class="field"><label>Email</label><input type="email" name="email" required></div>
      <div class="field"><label>City</label><input name="city" required></div>
      <div class="field"><label>Product category</label><input name="category" required placeholder="Kurtas, sarees, dresses..."></div>
      <div class="field"><label>Instagram / website link optional</label><input name="website"></div>
      <div class="field"><label>Short message</label><textarea name="message" required></textarea></div>
      <button class="btn" type="submit">Submit Application</button>
    </form>
  `);
}

async function renderOrders() {
  if (!state.user) return renderLogin();
  const { orders } = await api("/api/orders");
  shell(`<div><div class="eyebrow">Account</div><h2>Order history</h2></div>`, orders.length ? `
    <div class="panel">
      ${orders.map(order => `
        <div class="order-row">
          <div><h3>${order.id}</h3><p>${new Date(order.createdAt).toLocaleString()} • ${order.items.length} item(s)</p></div>
          <span class="pill">${order.status}</span>
          ${order.shipment?.trackingId ? `<p>Tracking ID: ${order.shipment.trackingId}<br>Shipment: ${order.shipment.status}</p>` : ""}
          <strong>${money(order.total)}</strong>
        </div>
      `).join("")}
    </div>
  ` : `<div class="empty"><div><h3>No orders yet</h3><p>Your orders will appear here after checkout.</p></div></div>`);
}

function renderAdminLogin() {
  app.innerHTML = `
    <section class="admin-login-page">
      <form data-form="admin-login" class="admin-login-card form-grid">
        <div>
          <div class="brand admin-brand"><span class="brand-mark">RF</span><span>Rukhsar Fashion</span></div>
          <div class="eyebrow">Executive Access</div>
          <h1>Admin login</h1>
          <p>Manage products, orders, seller applications, settings, and customers from one secure workspace.</p>
        </div>
        <div class="field"><label>Email</label><input type="email" name="email" value="admin@rukhsarfashion.com" required></div>
        <div class="field"><label>Password</label><input type="password" name="password" required></div>
        <button class="btn" type="submit">Login to Dashboard</button>
        <button class="btn ghost" type="button" data-action="oauth-login" data-role="admin">Continue with Google as Admin</button>
      </form>
    </section>
  `;
}

function renderNotAuthorized(message = "Not authorized") {
  app.innerHTML = `
    <section class="admin-login-page">
      <div class="admin-login-card admin-denied">
        <div class="eyebrow">Access Control</div>
        <h1>${message}</h1>
        <p>This account is signed in, but it is not authorized for the Rukhsar Fashion admin control center.</p>
        <div class="actions">
          <a class="btn ghost" href="#/">Return to Store</a>
          <button class="btn danger" data-action="logout">Logout</button>
        </div>
      </div>
    </section>
  `;
}

async function renderAdmin() {
  if (!hasValidToken()) {
    navigate("/admin");
    return;
  }
  app.innerHTML = `<section class="admin-login-page"><div class="admin-login-card admin-loading"><div class="eyebrow">Secure Gateway</div><h1>Verifying access</h1><p>Please wait while your admin session is confirmed.</p><div class="skeleton-lines"><span></span><span></span><span></span></div></div></section>`;
  try {
    const user = await ensureAdminAccess();
    if (!user) {
      navigate("/admin");
      return;
    }
  } catch (error) {
    if (/not admin|not authorized|access denied/i.test(error.message)) {
      renderNotAuthorized("Not authorized");
      return;
    }
    clearSession();
    navigate("/admin");
    toast(error.message);
    return;
  }
  const adminData = await loadAdminData({
    includeSettings: state.adminTab === "settings",
    includeUsers: state.adminTab === "users"
  });
  const summary = adminData.summary;
  const products = adminData.products;
  const orders = adminData.orders;
  const users = adminData.users || [];
  const settings = adminData.settings || state.settings;
  app.innerHTML = `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <div class="brand admin-brand"><span class="brand-mark">RF</span><span>Rukhsar Fashion</span></div>
        <nav class="admin-nav" aria-label="Admin navigation">
          ${adminNavButton("dashboard", "Dashboard", "01")}
          ${adminNavButton("products", "Products", "02")}
          ${adminNavButton("add", "Add Product", "03")}
          ${adminNavButton("orders", "Orders", "04")}
          ${adminNavButton("applications", "Seller Applications", "05")}
          ${adminNavButton("settings", "Settings", "06")}
          ${adminNavButton("users", "Users", "07")}
          <button data-action="logout"><span class="nav-icon">08</span><span>Logout</span></button>
        </nav>
      </aside>
      <div class="admin-main">
        <header class="admin-topbar">
          <div>
            <div class="eyebrow">Executive Dashboard</div>
            <h1>${adminTitle()}</h1>
            <p>Fast operational controls for products, orders, sellers, settings, and customer access.</p>
          </div>
          <button class="btn secondary" data-action="admin-tab" data-tab="add">Add Product</button>
        </header>
        <section id="adminContent">${adminTabContent(summary, products, orders, users, settings)}</section>
      </div>
      ${state.deleteProductId ? deleteModal(products.find(product => product.id === state.deleteProductId)) : ""}
    </section>
  `;
}

function adminNavButton(tab, label, icon = "") {
  return `<button data-action="admin-tab" data-tab="${tab}" class="${state.adminTab === tab ? "active" : ""}">${icon ? `<span class="nav-icon">${icon}</span>` : ""}<span>${label}</span></button>`;
}

function adminTitle() {
  const titles = {
    dashboard: "Dashboard",
    products: "Product Management",
    add: state.editingProduct ? "Edit Product" : "Add Product",
    orders: "Orders",
    applications: "Seller Applications",
    settings: "Settings",
    users: "Users"
  };
  return titles[state.adminTab] || "Dashboard";
}

function adminTabContent(summary, products, orders, users, settings) {
  if (state.adminTab === "dashboard") {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lowStock = products.filter(product => Number(product.stock || 0) <= 5).length;
    const pendingOrders = orders.filter(order => ["Placed", "Packed"].includes(order.status)).length;
    return `
      <div class="stats admin-stats">
        ${adminStat("Total Products", summary.totals.products, "Catalog live")}
        ${adminStat("Orders", summary.totals.orders, "All channels")}
        ${adminStat("Revenue", money(revenue), "Recorded orders")}
        ${adminStat("Seller Applications", summary.totals.sellerApplications, "Pipeline")}
        ${adminStat("Low Stock", lowStock, "Needs attention")}
        ${adminStat("Pending Orders", pendingOrders, "Action queue")}
      </div>
      <div class="admin-grid">
        <div class="table-card">
          <h3>Recent orders</h3>
          ${orders.length ? compactOrderList(orders.slice(0, 5)) : `<div class="empty compact">No orders yet.</div>`}
        </div>
        <div class="table-card">
          <h3>Seller applications</h3>
          ${summary.sellerApplications.length ? applicationTable(summary.sellerApplications.slice(0, 5), true) : `<div class="empty compact">No applications yet.</div>`}
        </div>
      </div>
    `;
  }
  if (state.adminTab === "products") {
    return adminProductsPanel(products);
  }
  if (state.adminTab === "add") {
    return productForm(state.editingProduct);
  }
  if (state.adminTab === "orders") {
    return `<div class="table-card table-scroll">${orderTable(orders)}</div>`;
  }
  if (state.adminTab === "applications") {
    return `<div class="table-card table-scroll">${applicationTable(summary.sellerApplications)}</div>`;
  }
  if (state.adminTab === "settings") {
    return settingsPanel(settings);
  }
  return `<div class="table-card table-scroll">${userTable(users)}</div>`;
}

function adminStat(label, value, helper) {
  return `<div class="stat admin-stat"><span>${label}</span><strong>${value}</strong><small>${helper}</small></div>`;
}

function adminProductsPanel(products) {
  const filtered = products.filter(product => {
    const query = state.adminSearch.toLowerCase();
    const matchesQuery = !query || [product.name, product.category, product.description].join(" ").toLowerCase().includes(query);
    const matchesCategory = !state.adminCategory || product.category === state.adminCategory;
    return matchesQuery && matchesCategory;
  });
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  state.adminPage = Math.min(state.adminPage, totalPages);
  const pageItems = filtered.slice((state.adminPage - 1) * perPage, state.adminPage * perPage);
  return `
    <div class="admin-toolbar">
      <input class="input" data-action="admin-search" type="search" placeholder="Search products..." value="${state.adminSearch}">
      <select class="input" data-action="admin-category">
        <option value="">All categories</option>
        ${adminCategories.map(([value, label]) => `<option value="${value}" ${state.adminCategory === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </div>
    <div class="table-card table-scroll">${pageItems.length ? productTable(pageItems) : `<div class="empty compact"><h3>No products found</h3><p>Try a different search or category.</p></div>`}</div>
    <div class="pagination">
      <button class="btn ghost" data-action="admin-page" data-page="${state.adminPage - 1}" ${state.adminPage <= 1 ? "disabled" : ""}>Previous</button>
      <span>Page ${state.adminPage} of ${totalPages}</span>
      <button class="btn ghost" data-action="admin-page" data-page="${state.adminPage + 1}" ${state.adminPage >= totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function productForm(product = null) {
  const selectedSizes = product?.sizes || [];
  const gallery = (product?.galleryImages || []).join("\n");
  const thumbnail = product?.thumbnail || product?.images?.[0] || "";
  const video = product?.videoUrl || "";
  return `
    <form data-form="admin-product" class="admin-product-form form-grid">
      <input type="hidden" name="id" value="${product?.id || ""}">
      <div class="form-section">
        <h3>Product details</h3>
        <div class="form-grid two">
          <div class="field"><label>Product name</label><input name="name" value="${product?.name || ""}" required></div>
          <div class="field"><label>Category</label><select name="category" required>${adminCategories.map(([value, label]) => `<option value="${value}" ${product?.category === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
          <div class="field span-two"><label>Description</label><textarea name="description" required>${product?.description || ""}</textarea></div>
        </div>
      </div>
      <div class="form-section">
        <h3>Pricing and stock</h3>
        <div class="form-grid three">
          <div class="field"><label>Price</label><input name="price" type="number" min="1" value="${product?.price || ""}" required></div>
          <div class="field"><label>Discount price</label><input name="discountPrice" type="number" min="0" value="${product?.discountPrice || ""}"></div>
          <div class="field"><label>Stock quantity</label><input name="stock" type="number" min="0" value="${product?.stock ?? ""}" required></div>
        </div>
      </div>
      <div class="form-section">
        <h3>Options</h3>
        <div class="field"><label>Sizes</label><div class="check-grid">${["XS", "S", "M", "L", "XL", "XXL"].map(size => `<label><input type="checkbox" name="sizes" value="${size}" ${selectedSizes.includes(size) ? "checked" : ""}> ${size}</label>`).join("")}</div></div>
        <div class="field"><label>Colors</label><input name="colors" value="${(product?.colors || []).join(", ")}" placeholder="Ivory, Blush, Champagne" required></div>
      </div>
      <div class="form-section">
        <h3>Media</h3>
        <p class="section-helper">Upload product media directly. External URLs are optional and tucked below for imports.</p>
        <input type="hidden" name="thumbnail" value="${thumbnail}">
        <textarea class="hidden" name="galleryImages">${gallery}</textarea>
        <input type="hidden" name="videoUrl" value="${video}">
        <div class="media-upload-layout">
          ${uploadZone("thumbnail", "Thumbnail image", "Upload the main catalog image", "image/*", false, thumbnail ? [thumbnail] : [])}
          ${uploadZone("gallery", "Gallery images", "Add lookbook and detail images", "image/*", true, product?.galleryImages || [])}
          ${uploadZone("video", "Product video", "Add a short styling or fabric video", "video/*", false, video ? [video] : [], true)}
        </div>
        <details class="advanced-media">
          <summary>Use external image/video URL</summary>
          <div class="form-grid two">
            <div class="field"><label>Thumbnail image URL</label><input data-action="media-url-input" data-target="thumbnail" value="${thumbnail}" placeholder="https://..."></div>
            <div class="field"><label>Product video URL</label><input data-action="media-url-input" data-target="video" value="${video}" placeholder="https://... or mp4 URL"></div>
            <div class="field span-two"><label>Gallery image URLs</label><textarea data-action="media-url-input" data-target="gallery" placeholder="One image URL per line">${gallery}</textarea></div>
          </div>
        </details>
      </div>
      <div class="form-section">
        <h3>Publishing</h3>
        <div class="check-grid">
          <label><input type="checkbox" name="featured" ${product?.featured ? "checked" : ""}> Featured product</label>
          <label><input type="checkbox" name="active" ${product?.status !== "inactive" ? "checked" : ""}> Active product</label>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn" type="submit">${product ? "Update Product" : "Add Product"}</button>
        ${product ? `<button class="btn ghost" type="button" data-action="cancel-edit">Cancel</button>` : ""}
      </div>
    </form>
  `;
}

function uploadZone(kind, title, helper, accept, multiple, items = [], isVideo = false) {
  const inputName = kind === "thumbnail" ? "thumbnailFile" : kind === "gallery" ? "galleryFiles" : "videoFile";
  return `
    <div class="upload-card" data-upload-kind="${kind}">
      <div class="upload-head">
        <div>
          <strong>${title}</strong>
          <span>${helper}</span>
        </div>
        <span class="upload-status" data-upload-status="${kind}">${items.length ? "Ready" : "Waiting"}</span>
      </div>
      <label class="drop-zone" data-action="drop-zone" data-kind="${kind}">
        <input name="${inputName}" type="file" accept="${accept}" ${multiple ? "multiple" : ""}>
        <span class="drop-icon">+</span>
        <strong>Drag and drop or click to upload</strong>
        <small>${isVideo ? "MP4/WebM recommended" : "JPG, PNG or WebP recommended"}</small>
      </label>
      <div class="media-preview-grid ${isVideo ? "video-preview-grid" : ""}" data-preview="${kind}">
        ${items.map((item, index) => mediaPreview(kind, item, index, isVideo)).join("")}
      </div>
    </div>
  `;
}

function mediaPreview(kind, src, index, isVideo = false) {
  const media = isVideo || src.startsWith("data:video") || /\.(mp4|webm|ogg)(\?|$)/i.test(src)
    ? `<video src="${src}" muted preload="metadata"></video>`
    : imageTag(src, `${kind} preview ${index + 1}`);
  return `
    <div class="media-preview" data-src="${src}">
      ${media}
      <div class="media-preview-actions">
        <button type="button" data-action="replace-media" data-kind="${kind}" data-index="${index}">Replace</button>
        <button type="button" data-action="remove-media" data-kind="${kind}" data-index="${index}">Remove</button>
      </div>
    </div>
  `;
}

function productTable(products) {
  return `<table class="product-admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Discount price</th><th>Sizes</th><th>Stock</th><th>Status</th><th>Featured</th><th></th></tr></thead><tbody>${products.map(product => `
    <tr>
      <td><div class="admin-product-cell">${imageTag(productImage(product), product.name, "", 'loading="lazy"')}<div><strong>${product.name}</strong><br><span class="muted">${product.id}</span></div></div></td>
      <td>${categoryLabel(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${money(discountPrice(product))}</td>
      <td><div class="size-list compact-sizes">${(product.sizes || []).map(size => `<span>${size}</span>`).join("")}</div></td>
      <td>${product.stock}</td>
      <td><span class="status ${product.status === "inactive" ? "inactive" : "active"}">${product.status === "inactive" ? "Inactive" : "Active"}</span></td>
      <td>${product.featured ? `<span class="pill champagne-pill">Featured</span>` : `<span class="muted">No</span>`}</td>
      <td>
        <div class="row-actions">
          <button class="btn secondary" data-action="edit-product" data-product='${JSON.stringify(product).replaceAll("'", "&#39;")}'>Edit</button>
          <button class="btn danger" data-action="ask-delete-product" data-id="${product.id}">Delete</button>
        </div>
      </td>
    </tr>`).join("")}</tbody></table>`;
}

const settingsTabs = [
  ["general", "General Store Settings"],
  ["branding", "Branding"],
  ["homepage", "Homepage Management"],
  ["product", "Product Settings"],
  ["payment", "Payment Settings"],
  ["shipping", "Logistics & Shipping"],
  ["seo", "SEO Settings"],
  ["policies", "Policies"],
  ["social", "Social Media"],
  ["notifications", "Notifications"],
  ["security", "Security"],
  ["integrations", "Integrations"]
];

function settingsPanel(settings) {
  const active = state.settingsTab;
  return `
    <div class="settings-layout">
      <aside class="settings-tabs">
        ${settingsTabs.map(([key, label]) => `<button data-action="settings-tab" data-tab="${key}" class="${active === key ? "active" : ""}">${label}</button>`).join("")}
      </aside>
      <div class="settings-content">
        ${settingsForm(active, settings[active])}
      </div>
    </div>
  `;
}

function settingsForm(section, values) {
  if (section === "security") return securitySettings(values);
  const title = settingsTabs.find(([key]) => key === section)?.[1] || "Settings";
  return `
    <form data-form="settings" data-section="${section}" class="settings-form form-grid">
      <div class="form-section">
        <h3>${title}</h3>
        ${settingsFields(section, values)}
      </div>
      <div class="form-actions"><button class="btn" type="submit">Save Settings</button></div>
    </form>
  `;
}

function settingsFields(section, values) {
  const field = (name, label, type = "text", extra = "") => `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${values[name] ?? ""}" ${extra}></div>`;
  const area = (name, label, extra = "") => `<div class="field span-two"><label>${label}</label><textarea name="${name}" ${extra}>${Array.isArray(values[name]) ? values[name].join("\n") : values[name] || ""}</textarea></div>`;
  const toggle = (name, label) => `<label class="switch-row"><input name="${name}" type="checkbox" ${values[name] ? "checked" : ""}> <span>${label}</span></label>`;
  const image = (name, label) => `<div class="field media-setting"><label>${label}</label>${values[name] ? imageTag(values[name], `${label} preview`) : ""}<input name="${name}" value="${values[name] || ""}" placeholder="Image URL or upload below"><input name="${name}File" type="file" accept="image/*"><button class="btn ghost" type="button" data-action="clear-setting-image" data-field="${name}">Delete</button></div>`;

  const maps = {
    general: () => `<div class="form-grid two">${field("storeName", "Store name")}${field("tagline", "Store tagline")}${field("supportEmail", "Support email", "email")}${field("supportPhone", "Support phone")}${field("whatsappNumber", "WhatsApp number")}${field("gstNumber", "GST number")}${field("currency", "Currency")}${field("timezone", "Timezone")}${area("businessAddress", "Business address")}</div><div class="check-grid">${toggle("maintenanceMode", "Maintenance mode")}${toggle("storeActive", "Store active")}</div>`,
    branding: () => `<div class="form-grid two">${image("logo", "Logo")}${image("favicon", "Favicon")}${image("footerLogo", "Footer logo")}${field("primaryColor", "Brand mocha color", "color")}${field("accentColor", "Dusty rose color", "color")}${field("champagneColor", "Champagne accent", "color")}${area("homepageBanners", "Homepage banners - one URL per line")}${area("mobileBanners", "Mobile banners - one URL per line")}${area("promotionalBanners", "Promotional banners - one URL per line")}</div>`,
    homepage: () => `<div class="form-grid two">${field("heroTitle", "Hero title")}${field("heroCtaText", "Hero CTA button text")}${area("heroSubtitle", "Hero subtitle")}${field("heroMedia", "Hero image/video URL")}${area("featuredCollections", "Featured collections")}${field("chikankariTitle", "Chikankari section title")}${area("chikankariCopy", "Chikankari section copy")}${area("categoryOrder", "Homepage category order")}${area("promotionalStrips", "Promotional strips")}${field("announcementBarText", "Announcement bar text")}</div><div class="check-grid">${toggle("chikankariEnabled", "Enable Chikankari section")}${toggle("featuredProductsEnabled", "Enable featured products")}${toggle("collectionSectionEnabled", "Enable collection section")}</div>`,
    product: () => `<div class="form-grid two">${area("categories", "Product categories")}${area("sizes", "Sizes")}${area("colors", "Colors")}${field("featuredProductRules", "Featured product rules")}${field("productVisibility", "Product visibility")}${field("lowStockThreshold", "Low stock alert threshold", "number")}${field("defaultSorting", "Product sorting default")}</div><div class="check-grid">${toggle("inventoryTracking", "Track inventory")}</div>`,
    payment: () => `<div class="form-grid two">${toggle("razorpayEnabled", "Enable Razorpay")}${field("razorpayKeyId", "Razorpay Key ID")}${field("razorpayKeySecret", "Razorpay Key Secret", "password", "placeholder='Leave blank to keep existing secret'")}${field("razorpayWebhookSecret", "Razorpay Webhook Secret", "password", "placeholder='Leave blank to keep existing secret'")}${field("paymentMode", "Payment mode")}${toggle("codEnabled", "Enable COD")}${field("minCodAmount", "Minimum COD amount", "number")}${field("maxCodAmount", "Maximum COD amount", "number")}${toggle("autoInvoice", "Auto invoice")}${area("successMessage", "Payment success message")}${area("failureMessage", "Payment failure message")}</div>`,
    shipping: () => `<div class="form-grid two">${toggle("shiprocketEnabled", "Enable Shiprocket")}${field("shiprocketEmail", "API email")}${field("shiprocketPassword", "API password", "password", "placeholder='Leave blank to keep existing password'")}${field("shiprocketToken", "API token", "password", "placeholder='Leave blank to keep existing token'")}${field("pickupLocation", "Pickup location")}${field("packageLength", "Package length cm", "number")}${field("packageBreadth", "Package breadth cm", "number")}${field("packageHeight", "Package height cm", "number")}${field("packageWeight", "Package weight kg", "number")}${area("shippingModes", "Shipping modes")}</div><div class="check-grid">${toggle("codShippingEnabled", "COD shipping")}${toggle("autoOrderSync", "Auto order sync")}${toggle("autoAwbGeneration", "Auto AWB generation")}${toggle("autoShipmentCreation", "Auto shipment creation")}</div>`,
    seo: () => `<div class="form-grid two">${field("metaTitle", "Meta title")}${field("keywords", "Keywords")}${area("metaDescription", "Meta description")}${image("ogImage", "Open Graph image")}${field("twitterCard", "Twitter card")}${area("robotsTxt", "Robots.txt")}</div><div class="check-grid">${toggle("sitemapEnabled", "Enable sitemap")}</div>`,
    policies: () => `${area("privacyPolicy", "Privacy Policy", "rows='8'")}${area("returnPolicy", "Return Policy", "rows='8'")}${area("shippingPolicy", "Shipping Policy", "rows='8'")}${area("termsConditions", "Terms & Conditions", "rows='8'")}${area("refundPolicy", "Refund Policy", "rows='8'")}`,
    social: () => `<div class="form-grid two">${field("instagram", "Instagram")}${field("facebook", "Facebook")}${field("pinterest", "Pinterest")}${field("youtube", "YouTube")}${field("whatsapp", "WhatsApp")}${field("twitter", "Twitter/X")}</div>`,
    notifications: () => `<div class="form-grid two">${field("adminNotificationEmail", "Admin notification email", "email")}</div><div class="check-grid">${toggle("orderConfirmationEmails", "Order confirmation emails")}${toggle("sellerInquiryNotifications", "Seller inquiry notifications")}${toggle("paymentAlerts", "Payment alerts")}${toggle("shippingAlerts", "Shipping alerts")}${toggle("whatsappNotifications", "WhatsApp notifications")}</div>`,
    integrations: () => `<div class="form-grid two">${field("googleAnalyticsId", "Google Analytics ID")}${field("metaPixelId", "Meta Pixel ID")}${field("emailProvider", "Email provider")}${field("whatsappProvider", "WhatsApp provider")}${field("customWebhookUrl", "Custom webhook URL")}</div>`
  };
  return maps[section]?.() || "";
}

function securitySettings(values) {
  return `
    <div class="form-section">
      <h3>Security Settings</h3>
      <form data-form="settings" data-section="security" class="form-grid two">
        <div class="field"><label>Session timeout minutes</label><input name="sessionTimeoutMinutes" type="number" value="${values.sessionTimeoutMinutes}"></div>
        <div class="field"><label>Maximum failed attempts</label><input name="maxFailedAttempts" type="number" value="${values.maxFailedAttempts}"></div>
        <div class="check-grid span-two">
          <label><input name="failedLoginProtection" type="checkbox" ${values.failedLoginProtection ? "checked" : ""}> Failed login protection</label>
          <label><input name="roleBasedAccess" type="checkbox" ${values.roleBasedAccess ? "checked" : ""}> Role-based admin access</label>
        </div>
        <button class="btn" type="submit">Save Security Settings</button>
      </form>
    </div>
    <div class="form-section">
      <h3>Update admin password</h3>
      <form data-form="admin-password" class="form-grid two">
        <div class="field"><label>Current password</label><input name="currentPassword" type="password" required></div>
        <div class="field"><label>New password</label><input name="newPassword" type="password" required minlength="8"></div>
        <button class="btn" type="submit">Update Password</button>
      </form>
    </div>
    <div class="table-card table-scroll">
      <h3>Login activity logs</h3>
      <table><thead><tr><th>Email</th><th>Status</th><th>IP</th><th>Date</th></tr></thead><tbody>${(values.loginActivityLogs || []).slice(0, 10).map(log => `<tr><td>${log.email}</td><td>${log.status}</td><td>${log.ip}</td><td>${new Date(log.createdAt).toLocaleString()}</td></tr>`).join("")}</tbody></table>
    </div>
  `;
}

function deleteModal(product) {
  if (!product) return "";
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm product delete">
      <div class="modal">
        <h2>Delete product?</h2>
        <p>This will remove <strong>${product.name}</strong> from the store and admin product list.</p>
        <div class="actions">
          <button class="btn danger" data-action="delete-product" data-id="${product.id}">Delete Product</button>
          <button class="btn ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function compactOrderList(orders) {
  return orders.map(order => `
    <div class="order-row">
      <div><h3>${order.id}</h3><p>${order.customer.fullName} • ${new Date(order.createdAt).toLocaleDateString()}</p></div>
      <span class="pill">${order.status}</span>
      <strong>${money(order.total)}</strong>
    </div>
  `).join("");
}

function orderTable(orders) {
  return `<table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map(order => `
    <tr>
      <td>${order.id}<br>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>${order.customer.fullName}<br>${order.address.phone}</td>
      <td>${money(order.total)}</td>
      <td><select data-action="order-status" data-id="${order.id}">
        ${["Placed", "Packed", "Shipped", "Delivered", "Cancelled"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
      </select></td>
    </tr>`).join("")}</tbody></table>`;
}

function applicationTable(applications, compact = false) {
  if (compact) {
    return applications.map(item => `<div class="order-row"><div><h3>${item.shopName}</h3><p>${item.fullName} • ${item.city}</p></div><span class="pill">${item.category}</span></div>`).join("");
  }
  return `<table><thead><tr><th>Brand</th><th>Contact</th><th>Category</th><th>Message</th></tr></thead><tbody>${applications.map(item => `
    <tr><td>${item.shopName}<br>${item.city}</td><td>${item.fullName}<br>${item.phone}<br>${item.email}</td><td>${item.category}</td><td>${item.message}</td></tr>
  `).join("")}</tbody></table>`;
}

function userTable(users) {
  return `<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>${users.map(user => `
    <tr><td>${user.fullName}</td><td>${user.email}</td><td>${user.role}</td><td>${new Date(user.createdAt).toLocaleDateString()}</td></tr>
  `).join("")}</tbody></table>`;
}

const handlers = {
  "oauth-login": async (event, button) => {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Connecting...";
    try {
      await startGoogleLogin(button.dataset.role || "customer");
    } catch (error) {
      button.disabled = false;
      button.textContent = original;
      const form = button.closest("form");
      if (form) showFormMessage(form, error.message, "error");
      else toast(error.message);
    }
  },
  qty: (event, button) => {
    const item = state.cart.find(cartItem => cartItem.key === button.dataset.id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + Number(button.dataset.delta));
    saveCart();
    renderCart();
  },
  "remove-cart": (event, button) => {
    state.cart = state.cart.filter(item => item.key !== button.dataset.id);
    saveCart();
    renderCart();
  },
  logout: async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearSession();
    invalidateAdminCache();
    navigate("/admin");
  },
  "admin-tab": (event, button) => {
    state.adminTab = button.dataset.tab;
    if (state.adminTab !== "add") state.editingProduct = null;
    if (state.adminTab === "settings" && location.pathname !== "/admin/settings") {
      history.pushState({}, "", "/admin/settings");
    } else if (state.adminTab !== "settings" && location.pathname !== "/admin/dashboard") {
      history.pushState({}, "", "/admin/dashboard");
    }
    renderAdmin();
  },
  "settings-tab": (event, button) => {
    state.settingsTab = button.dataset.tab;
    renderAdmin();
  },
  "clear-setting-image": (event, button) => {
    const form = button.closest("form");
    if (form?.elements[button.dataset.field]) form.elements[button.dataset.field].value = "";
    button.closest(".media-setting")?.querySelector("img")?.remove();
  },
  "drop-zone": (event, label) => {
    if (event.target.matches('input[type="file"]')) return;
  },
  "remove-media": (event, button) => {
    removeMediaItem(button.dataset.kind, Number(button.dataset.index));
  },
  "replace-media": (event, button) => {
    const card = button.closest(".upload-card");
    const input = card.querySelector('input[type="file"]');
    input.dataset.replaceIndex = button.dataset.index;
    input.click();
  },
  "media-url-input": (event, input) => {
    syncMediaUrlInput(input.dataset.target, input.value);
  },
  "admin-search": (event, input) => {
    state.adminSearch = input.value;
    state.adminPage = 1;
    renderAdmin();
  },
  "admin-category": (event, select) => {
    state.adminCategory = select.value;
    state.adminPage = 1;
    renderAdmin();
  },
  "admin-page": (event, button) => {
    state.adminPage = Number(button.dataset.page);
    renderAdmin();
  },
  "preview-media": (event, button) => {
    document.querySelector("#detailImage").src = button.dataset.src;
    document.querySelectorAll(".media-thumbs button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  },
  "edit-product": (event, button) => {
    state.editingProduct = JSON.parse(button.dataset.product);
    state.adminTab = "add";
    renderAdmin();
    scrollTo({ top: 0, behavior: "smooth" });
  },
  "cancel-edit": () => {
    state.editingProduct = null;
    state.adminTab = "products";
    renderAdmin();
  },
  "ask-delete-product": (event, button) => {
    state.deleteProductId = button.dataset.id;
    renderAdmin();
  },
  "close-modal": () => {
    state.deleteProductId = null;
    renderAdmin();
  },
  "delete-product": async (event, button) => {
    await api(`/api/admin/products/${button.dataset.id}`, { method: "DELETE" });
    invalidateAdminCache();
    state.deleteProductId = null;
    toast("Product deleted.");
    renderAdmin();
  },
  "order-status": async (event, select) => {
    await api(`/api/admin/orders/${select.dataset.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value })
    });
    invalidateAdminCache();
    toast("Order status updated.");
  }
};

async function fileToDataUrl(file) {
  if (file.type.startsWith("image/")) {
    return compressImageFile(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read media file."));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 1600;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function filesToDataUrls(fileList) {
  return Promise.all(Array.from(fileList || []).map(fileToDataUrl));
}

function linesToList(value) {
  return String(value || "").split(/\n|,/).map(item => item.trim()).filter(Boolean);
}

function currentMedia(kind) {
  const selector = kind === "thumbnail" ? 'input[name="thumbnail"]' : kind === "gallery" ? 'textarea[name="galleryImages"]' : 'input[name="videoUrl"]';
  const field = document.querySelector(selector);
  if (!field) return [];
  if (kind === "gallery") return linesToList(field.value);
  return field.value ? [field.value] : [];
}

function setCurrentMedia(kind, items) {
  const cleanItems = items.filter(Boolean);
  if (kind === "thumbnail") document.querySelector('input[name="thumbnail"]').value = cleanItems[0] || "";
  if (kind === "video") document.querySelector('input[name="videoUrl"]').value = cleanItems[0] || "";
  if (kind === "gallery") document.querySelector('textarea[name="galleryImages"]').value = cleanItems.join("\n");
  renderMediaPreview(kind, cleanItems);
}

function setUploadStatus(kind, status, tone = "") {
  const el = document.querySelector(`[data-upload-status="${kind}"]`);
  if (!el) return;
  el.textContent = status;
  el.dataset.tone = tone;
}

async function handleMediaFiles(input, kind) {
  try {
    setUploadStatus(kind, "Uploading...", "loading");
    const urls = await filesToDataUrls(input.files);
    let items = currentMedia(kind);
    if (kind === "gallery") {
      items = [...items, ...urls];
    } else {
      const replaceIndex = input.dataset.replaceIndex;
      if (replaceIndex !== undefined && items[Number(replaceIndex)]) items[Number(replaceIndex)] = urls[0];
      else items = urls[0] ? [urls[0]] : items;
      delete input.dataset.replaceIndex;
    }
    setCurrentMedia(kind, items);
    setUploadStatus(kind, "Uploaded", "success");
  } catch (error) {
    setUploadStatus(kind, "Failed", "failed");
    toast(error.message);
  } finally {
    input.value = "";
  }
}

function renderMediaPreview(kind, items) {
  const container = document.querySelector(`[data-preview="${kind}"]`);
  if (!container) return;
  const isVideo = kind === "video";
  container.innerHTML = items.map((item, index) => mediaPreview(kind, item, index, isVideo)).join("");
  if (!items.length) setUploadStatus(kind, "Waiting");
}

function removeMediaItem(kind, index) {
  const items = currentMedia(kind);
  items.splice(index, 1);
  setCurrentMedia(kind, items);
  setUploadStatus(kind, items.length ? "Ready" : "Waiting", items.length ? "success" : "");
}

function syncMediaUrlInput(kind, value) {
  if (kind === "gallery") setCurrentMedia(kind, linesToList(value));
  else setCurrentMedia(kind, value ? [value] : []);
  setUploadStatus(kind, value ? "Imported" : "Waiting", value ? "success" : "");
}

async function productFormPayload(form) {
  const formData = new FormData(form);
  const thumbnail = formData.get("thumbnail");
  const galleryImages = linesToList(formData.get("galleryImages"));
  const sizes = formData.getAll("sizes");
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
    discountPrice: Number(formData.get("discountPrice") || 0),
    category: formData.get("category"),
    sizes,
    colors: linesToList(formData.get("colors")),
    stock: Number(formData.get("stock")),
    thumbnail,
    galleryImages,
    videoUrl: formData.get("videoUrl"),
    featured: formData.has("featured"),
    status: formData.has("active") ? "active" : "inactive"
  };
}

async function settingsFormPayload(form) {
  const section = form.dataset.section;
  const formData = new FormData(form);
  const payload = {};
  const arrayFields = new Set(["homepageBanners", "mobileBanners", "promotionalBanners", "featuredCollections", "categoryOrder", "promotionalStrips", "categories", "sizes", "colors", "shippingModes"]);
  const booleanFields = {
    general: ["maintenanceMode", "storeActive"],
    homepage: ["chikankariEnabled", "featuredProductsEnabled", "collectionSectionEnabled"],
    product: ["inventoryTracking"],
    payment: ["razorpayEnabled", "codEnabled", "autoInvoice"],
    shipping: ["shiprocketEnabled", "codShippingEnabled", "autoOrderSync", "autoAwbGeneration", "autoShipmentCreation"],
    seo: ["sitemapEnabled"],
    notifications: ["orderConfirmationEmails", "sellerInquiryNotifications", "paymentAlerts", "shippingAlerts", "whatsappNotifications"],
    security: ["failedLoginProtection", "roleBasedAccess"]
  };
  const numberFields = new Set(["minCodAmount", "maxCodAmount", "packageLength", "packageBreadth", "packageHeight", "packageWeight", "lowStockThreshold", "sessionTimeoutMinutes", "maxFailedAttempts"]);
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("File")) continue;
    if (arrayFields.has(key)) payload[key] = linesToList(value);
    else if (numberFields.has(key)) payload[key] = Number(value || 0);
    else payload[key] = value;
  }
  for (const key of booleanFields[section] || []) {
    payload[key] = formData.has(key);
  }
  for (const input of form.querySelectorAll('input[type="file"]')) {
    if (!input.files.length) continue;
    const field = input.name.replace(/File$/, "");
    const urls = await filesToDataUrls(input.files);
    if (arrayFields.has(field)) payload[field] = [...(payload[field] || []), ...urls];
    else payload[field] = urls[0] || payload[field] || "";
  }
  return payload;
}

const formHandlers = {
  "add-cart": async form => {
    const productId = new FormData(form).get("productId");
    const { product } = await api(`/api/products/${productId}`);
    const size = form.elements.size.value;
    if (!size) throw new Error("Please select a size.");
    const color = form.elements.color.value;
    const key = `${product.id}-${size}-${color}`;
    const existing = state.cart.find(item => item.key === key);
    if (existing) existing.qty += 1;
    else state.cart.push({ key, product, productId: product.id, size, color, qty: 1 });
    saveCart();
    toast("Added to cart.");
  },
  login: async form => {
    setButtonLoading(form, true, "Logging in...");
    const payload = Object.fromEntries(new FormData(form));
    try {
      saveSession(await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }));
      location.hash = "#/";
    } finally {
      setButtonLoading(form, false);
    }
  },
  signup: async form => {
    setButtonLoading(form, true, "Creating...");
    const payload = Object.fromEntries(new FormData(form));
    try {
      const session = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) });
      if (session.token) {
        saveSession(session);
        location.hash = "#/";
      } else {
        showFormMessage(form, session.message || "Please check your email to confirm your account.", "success");
      }
    } finally {
      setButtonLoading(form, false);
    }
  },
  "admin-login": async form => {
    setButtonLoading(form, true, "Logging in...");
    const payload = Object.fromEntries(new FormData(form));
    try {
      const session = await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
      if (session.user.role !== "admin") throw new Error("Admin access required.");
      saveSession(session);
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login failed:", error);
      showFormMessage(form, error.message, "error");
      throw error;
    } finally {
      setButtonLoading(form, false);
    }
  },
  checkout: async form => {
    const address = Object.fromEntries(new FormData(form));
    const paymentMethod = new FormData(form).get("paymentMethod");
    const items = state.cart.map(item => ({ productId: item.productId, qty: item.qty, size: item.size, color: item.color }));
    const total = state.cart.reduce((sum, item) => sum + discountPrice(item.product) * item.qty, 0);
    if (paymentMethod === "razorpay") {
      await api("/api/payments/razorpay/order", { method: "POST", body: JSON.stringify({ amount: total, receipt: `cart-${Date.now()}` }) });
      toast("Razorpay order created. Complete payment in the configured checkout.");
    }
    const { order } = await api("/api/orders", { method: "POST", body: JSON.stringify({ address, items, paymentMethod }) });
    state.cart = [];
    saveCart();
    location.hash = `#/success/${order.id}`;
  },
  seller: async form => {
    const payload = Object.fromEntries(new FormData(form));
    const result = await api("/api/seller-applications", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    showFormMessage(form, result.message, "success");
  },
  "admin-product": async form => {
    setButtonLoading(form, true, "Saving...");
    try {
      const payload = await productFormPayload(form);
      const id = payload.id;
      const path = id ? `/api/admin/products/${id}` : "/api/admin/products";
      const method = id ? "PUT" : "POST";
      console.info("[ADMIN PRODUCT SUBMIT]", {
        url: new URL(path, window.location.origin).toString(),
        method,
        payload: {
          ...payload,
          thumbnail: payload.thumbnail ? `${payload.thumbnail.slice(0, 40)}... (${payload.thumbnail.length} chars)` : "",
          galleryImages: payload.galleryImages.map(item => `${item.slice(0, 30)}... (${item.length} chars)`),
          videoUrl: payload.videoUrl ? `${payload.videoUrl.slice(0, 40)}... (${payload.videoUrl.length} chars)` : ""
        }
      });
      await api(path, { method, body: JSON.stringify(payload) });
      invalidateAdminCache();
      toast(id ? "Product updated." : "Product added.");
      state.editingProduct = null;
      state.adminTab = "products";
      form.reset();
      renderAdmin();
    } finally {
      setButtonLoading(form, false);
    }
  },
  settings: async form => {
    setButtonLoading(form, true, "Saving...");
    try {
      const payload = await settingsFormPayload(form);
      const result = await api(`/api/admin/settings/${form.dataset.section}`, { method: "PUT", body: JSON.stringify(payload) });
      state.settings = result.settings;
      if (state.adminCache) state.adminCache.settings = result.settings;
      applyPublicSettings(result.settings);
      toast("Settings saved.");
      renderAdmin();
    } finally {
      setButtonLoading(form, false);
    }
  },
  "admin-password": async form => {
    setButtonLoading(form, true, "Updating...");
    try {
      await api("/api/admin/security/password", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      toast("Password updated. Please login again.");
      clearSession();
      navigate("/admin");
    } finally {
      setButtonLoading(form, false);
    }
  }
};

async function route() {
  if (await processAuthCallback()) return;
  mobileNav.classList.remove("open");
  saveCart();
  document.body.classList.toggle("admin-mode", location.pathname.startsWith("/admin"));
  document.body.classList.toggle("public-mode", !location.pathname.startsWith("/admin"));
  const [path, arg, subArg] = location.hash.replace("#/", "").split("/");
  try {
    if (location.pathname === "/admin") return renderAdminLogin();
    if (location.pathname === "/admin/settings") {
      state.adminTab = "settings";
      return renderAdmin();
    }
    if (location.pathname === "/admin/dashboard") return renderAdmin();
    if (location.pathname === "/collections/chikankari") return renderProducts("chikankari");
    if (!path) return renderHome();
    if (path === "products") return renderProducts();
    if (path === "collections" && arg === "chikankari") return renderProducts("chikankari");
    if (path === "product") return renderProductDetail(arg);
    if (path === "cart") return renderCart();
    if (path === "checkout") return renderCheckout();
    if (path === "login") return renderLogin("login");
    if (path === "signup") return renderLogin("signup");
    if (path === "seller") return renderSeller();
    if (path === "orders") return renderOrders();
    if (path === "admin-login") return renderAdminLogin();
    if (path === "admin") return renderAdmin();
    if (path === "success") return shell(`<div><div class="eyebrow">Success</div><h2>Order placed</h2></div>`, `<div class="message success">Thank you. Your order ${arg} has been placed successfully.</div><p><a class="btn" href="#/orders">View Orders</a></p>`);
    return renderHome();
  } catch (error) {
    if (location.pathname.startsWith("/admin") && /not admin|not authorized|access denied/i.test(error.message)) {
      renderNotAuthorized("Not authorized");
      return;
    }
    if (location.pathname.startsWith("/admin") && /admin access|required|login|session/i.test(error.message)) {
      clearSession();
      navigate("/admin");
      return;
    }
    shell(`<div><div class="eyebrow">Oops</div><h2>Something needs attention</h2></div>`, `<div class="message error">${error.message}</div>`);
  }
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

async function init() {
  saveCart();
  updateAdminVisibility(false);
  await refreshVerifiedSession();
  route();
}

init();
