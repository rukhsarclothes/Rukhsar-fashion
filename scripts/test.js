const assert = require("assert");
const fs = require("fs");
process.env.DISABLE_SUPABASE = "1";
process.env.DISABLE_RAZORPAY = "1";
const { server } = require("../server");
const { DB_FILE } = require("../server");

const PORT = 3107;
const base = `http://127.0.0.1:${PORT}`;
const dbBackup = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, "utf8") : null;

function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  return fetch(`${base}${path}`, { ...options, headers }).then(async response => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || (payload.errors || [`HTTP ${response.status}`]).join(" "));
    }
    return payload;
  });
}

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));

  const health = await request("/api/health");
  assert.equal(health.ok, true);

  const productList = await request("/api/products");
  assert.ok(productList.products.length >= 1, "products should load");
  assert.ok(productList.categories.includes("chikankari"), "chikankari category should be available");

  const adminLoginPage = await fetch(`${base}/admin`);
  assert.equal(adminLoginPage.status, 200, "/admin should serve the SPA admin login");

  const adminDashboardPage = await fetch(`${base}/admin/dashboard`);
  assert.equal(adminDashboardPage.status, 200, "/admin/dashboard should serve the protected SPA route");

  const adminSettingsPage = await fetch(`${base}/admin/settings`);
  assert.equal(adminSettingsPage.status, 200, "/admin/settings should serve the protected SPA route");

  const collectionPage = await fetch(`${base}/collections/chikankari`);
  assert.equal(collectionPage.status, 200, "chikankari collection route should serve the SPA");

  const search = await request("/api/products?q=kurta");
  assert.ok(search.products.some(product => product.name.toLowerCase().includes("kurta")), "search should find kurta");

  const chikankari = await request("/api/products?category=chikankari");
  assert.ok(chikankari.products.length >= 1, "chikankari category filter should return products");
  assert.ok(chikankari.products.every(product => product.category === "chikankari"), "chikankari filter should only return chikankari products");

  const product = await request(`/api/products/${productList.products[0].id}`);
  assert.equal(product.product.id, productList.products[0].id);
  assert.ok(product.product.sizes.length >= 1, "product should include sizes");

  const email = `test${Date.now()}@example.com`;
  const signup = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Test Customer",
      email,
      password: "secret123",
      phone: "9876543210",
      city: "Delhi",
      pincode: "110001"
    })
  });
  assert.equal(signup.user.role, "customer");

  const normalUserAdmin = await fetch(`${base}/api/admin/summary`, {
    headers: { Authorization: `Bearer ${signup.token}` }
  });
  assert.equal(normalUserAdmin.status, 403, "normal users should not access admin APIs");

  const missingSizeOrder = await fetch(`${base}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${signup.token}` },
    body: JSON.stringify({
      address: { fullName: "Test Customer", phone: "9876543210", addressLine: "A test lane", city: "Delhi" },
      items: [{ productId: product.product.id, qty: 1, color: product.product.colors[0] }]
    })
  });
  const missingSizePayload = await missingSizeOrder.json();
  assert.equal(missingSizeOrder.status, 400, "order without size should fail");
  assert.ok(missingSizePayload.errors.includes("Please select a size."), "missing size error should be clear");

  const order = await request("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${signup.token}` },
    body: JSON.stringify({
      address: { fullName: "Test Customer", phone: "9876543210", addressLine: "A test lane", city: "Delhi" },
      items: [{ productId: product.product.id, qty: 1, size: product.product.sizes[0], color: product.product.colors[0] }]
    })
  });
  assert.ok(order.order.id, "order should be created");

  const seller = await request("/api/seller-applications", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Seller One",
      shopName: "Rose Studio",
      phone: "9876543210",
      email: `seller${Date.now()}@example.com`,
      city: "Jaipur",
      category: "Sarees",
      website: "https://example.com",
      message: "We would like to list handmade sarees."
    })
  });
  assert.equal(seller.message, "Thank you. Our team will contact you shortly.");

  const wrongAdmin = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@rukhsarfashion.com", password: "wrong-password" })
  });
  assert.equal(wrongAdmin.status, 401, "wrong admin login should fail");

  const admin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@rukhsarfashion.com", password: "Admin@123" })
  });
  assert.equal(admin.user.role, "admin");

  const protectedFail = await fetch(`${base}/api/admin/summary`);
  assert.equal(protectedFail.status, 401, "admin summary should be protected");

  const summary = await request("/api/admin/summary", {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  assert.ok(summary.totals.sellerApplications >= 1, "seller applications should appear in admin");

  const publicSettings = await request("/api/settings");
  assert.ok(publicSettings.settings.general.storeName, "public settings should load");
  assert.equal(publicSettings.settings.payment.razorpayKeySecret, undefined, "public settings must not expose Razorpay secret");

  const savedSettings = await request("/api/admin/settings/general", {
    method: "PUT",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ storeName: "Rukhsar Fashion Test", maintenanceMode: false, storeActive: true })
  });
  assert.equal(savedSettings.settings.general.storeName, "Rukhsar Fashion Test", "admin should update general settings");

  const savedBranding = await request("/api/admin/settings/branding", {
    method: "PUT",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ logo: "data:image/png;base64,iVBORw0KGgo=", primaryColor: "#4a1828" })
  });
  assert.ok(savedBranding.settings.branding.logo.startsWith("data:image/png"), "admin should save uploaded image data");

  await request("/api/admin/settings/payment", {
    method: "PUT",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({
      razorpayEnabled: true,
      razorpayKeyId: "rzp_test_key",
      razorpayKeySecret: "secret",
      razorpayWebhookSecret: "webhook_secret",
      codEnabled: true,
      minCodAmount: 0,
      maxCodAmount: 9999,
      paymentMode: "test"
    })
  });
  const adminSettings = await request("/api/admin/settings", {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  assert.equal(adminSettings.settings.payment.razorpayKeySecret, "********", "admin settings should redact secret values");

  const paymentOrder = await request("/api/admin/payments/razorpay/order", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ amount: 2500, receipt: "test-receipt" })
  });
  assert.equal(paymentOrder.order.provider, "razorpay", "Razorpay order should be created server-side");

  const crypto = require("crypto");
  const paymentId = "pay_test";
  const signature = crypto.createHmac("sha256", "secret").update(`${paymentOrder.order.id}|${paymentId}`).digest("hex");
  const verifiedPayment = await request("/api/admin/payments/razorpay/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ razorpay_order_id: paymentOrder.order.id, razorpay_payment_id: paymentId, razorpay_signature: signature })
  });
  assert.equal(verifiedPayment.ok, true, "Razorpay signature should verify securely");

  const badWebhook = await fetch(`${base}/api/webhooks/razorpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": "bad" },
    body: JSON.stringify({ event: "payment.failed" })
  });
  assert.equal(badWebhook.status, 400, "bad Razorpay webhook signature should be rejected");

  await request("/api/admin/settings/shipping", {
    method: "PUT",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ shiprocketEnabled: true, autoShipmentCreation: true, autoAwbGeneration: true, pickupLocation: "Main Studio" })
  });

  const newProduct = await request("/api/admin/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({
      name: "Test Rose Tunic",
      category: "chikankari",
      price: 999,
      discount: 5,
      stock: 8,
      sizes: "XS, S, M, XL",
      colors: "Rose, Ivory",
      thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=72",
      galleryImages: [
        "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=72",
        "data:image/png;base64,iVBORw0KGgo="
      ],
      videoUrl: "https://example.com/product-video.mp4",
      description: "Test product for admin management.",
      featured: true,
      status: "active"
    })
  });
  assert.ok(newProduct.product.id, "admin should add product");
  assert.equal(newProduct.product.category, "chikankari", "admin should create chikankari products");
  assert.ok(newProduct.product.sizes.includes("XL"), "admin should create product sizes");
  assert.equal(newProduct.product.featured, true, "admin should mark product as featured");
  assert.equal(newProduct.product.status, "active", "admin should set active status");
  assert.equal(newProduct.product.galleryImages.length, 2, "admin should save gallery images");
  assert.equal(newProduct.product.videoUrl, "https://example.com/product-video.mp4", "admin should save video URL");

  const adminProducts = await request("/api/admin/products", {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  assert.ok(adminProducts.products.some(item => item.id === newProduct.product.id), "admin product list should include created product");

  const noMediaProduct = await fetch(`${base}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({
      name: "No Media Test",
      category: "Dresses",
      price: 1200,
      discountPrice: 999,
      stock: 4,
      sizes: ["S", "M"],
      colors: ["Ivory"],
      description: "Should return a readable validation error."
    })
  });
  const noMediaPayload = await noMediaProduct.json();
  assert.equal(noMediaProduct.status, 201, "product without thumbnail should save and use frontend fallback media");
  assert.ok(noMediaPayload.product.id, "product without thumbnail should return the saved product");
  await request(`/api/admin/products/${noMediaPayload.product.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin.token}` }
  });

  const uploadedOnlyProduct = await request("/api/admin/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({
      name: "Uploaded Thumbnail Product",
      category: "chikankari",
      price: 1500,
      discountPrice: 1299,
      stock: 3,
      sizes: ["XS", "S"],
      colors: ["Ivory"],
      thumbnail: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
      galleryImages: [],
      videoUrl: "",
      description: "Should save with uploaded thumbnail and no optional gallery or video.",
      featured: false,
      status: "active"
    })
  });
  assert.ok(uploadedOnlyProduct.product.id, "product should save with uploaded thumbnail data only");
  assert.equal(uploadedOnlyProduct.product.galleryImages.length, 0, "gallery should be optional");
  await request(`/api/admin/products/${uploadedOnlyProduct.product.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin.token}` }
  });

  const edited = await request(`/api/admin/products/${newProduct.product.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ ...newProduct.product, stock: 5, status: "inactive" })
  });
  assert.equal(edited.product.stock, 5, "admin should edit stock");
  assert.equal(edited.product.status, "inactive", "admin should edit active/inactive status");

  await request(`/api/admin/products/${newProduct.product.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin.token}` }
  });

  const updatedOrder = await request(`/api/admin/orders/${order.order.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ status: "shipped" })
  });
  assert.equal(updatedOrder.order.status, "shipped");

  const shipment = await request("/api/admin/shiprocket/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({ orderId: order.order.id })
  });
  assert.ok(shipment.shipment.trackingId, "Shiprocket sync should create tracking ID");
  assert.ok(shipment.shipment.awb, "Shiprocket sync should create AWB when enabled");
}

run()
  .then(() => {
    console.log("All API flow tests passed.");
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    server.close();
    if (dbBackup === null) {
      fs.rmSync(DB_FILE, { force: true });
    } else {
      fs.writeFileSync(DB_FILE, dbBackup);
    }
  });
