/* ============================================================
   VIKALPAYATI by Vishakha — Admin Dashboard
   Renders everything into #app. localStorage-backed via window.Store.
   Works on file:// with relative paths. No libs.
   ============================================================ */
(function () {
  const app = () => document.getElementById("app");
  const B = () => (window.VIKALPAYATI && window.VIKALPAYATI.brand) || {};
  const CATS = () => (window.VIKALPAYATI && window.VIKALPAYATI.categories) || [];

  let currentTab = "dashboard";

  // Live-mode routing helpers (fall back to local Store in demo mode).
  const LIVE = () => !!window.VIK_LIVE;
  const isAuthed = () => LIVE() ? window.VikBackend.isAdminLive() : Store.isAdmin();
  const signOut = () => { if (LIVE()) window.VikBackend.adminSignOut(); else Store.adminLogout(); };

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const attr = (s) => esc(s);

  const statusBadge = (status) => `<span class="badge ${esc(status)}">${esc(status)}</span>`;

  const paymentBadge = (o) => {
    const method = o.payment && o.payment.method === "cod"
      ? `<span class="badge cod">COD</span>`
      : `<span class="badge paid">Online</span>`;
    const st = o.payment && o.payment.status === "paid" ? "paid" : "pending";
    const stat = `<span class="badge ${st}">${esc(o.payment ? o.payment.status : "pending")}</span>`;
    return method + " " + stat;
  };

  const itemCount = (o) => (o.items || []).reduce((n, it) => n + (it.qty || 0), 0);

  const fmtDate = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const todayStr = () => new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });

  const slug = (name) => String(name || "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const uniqueId = (base) => {
    let id = base || "product";
    if (!Store.getProduct(id)) return id;
    let n = 2;
    while (Store.getProduct(id + "-" + n)) n++;
    return id + "-" + n;
  };

  const brandLockup = (white) => `
    <a class="brand" href="index.html">
      <span class="brand-mark">❖</span>
      <span class="brand-text"><strong>${esc(B().name || "VIKALPAYATI")}</strong><em>${esc(B().by || "")}</em></span>
    </a>`;

  /* ---------- modal plumbing ---------- */
  function closeModal() {
    const bd = document.getElementById("admin-modal");
    if (bd) bd.remove();
  }
  function openModal(title, bodyHTML, footHTML) {
    closeModal();
    const bd = document.createElement("div");
    bd.className = "modal-backdrop open";
    bd.id = "admin-modal";
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="x-close" data-close aria-label="Close">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-foot">${footHTML || ""}</div>
      </div>`;
    document.body.appendChild(bd);
    bd.addEventListener("click", (e) => {
      if (e.target === bd || e.target.closest("[data-close]")) closeModal();
    });
    return bd;
  }

  /* ============================================================
     LOGIN
     ============================================================ */
  function renderLogin() {
    const live = LIVE();
    app().innerHTML = `
      <div class="admin-login">
        <div class="box">
          <div style="text-align:center;margin-bottom:8px">${brandLockup()}</div>
          <h3 style="text-align:center;margin-top:14px">Admin Login</h3>
          <form id="login-form" autocomplete="off">
            <div class="field">
              <label for="lg-user">${live ? "Admin email" : "Username"}</label>
              <input type="${live ? "email" : "text"}" id="lg-user" placeholder="${live ? "you@email.com" : "admin"}" autofocus>
            </div>
            <div class="field" id="lg-pass-field">
              <label for="lg-pass">Password</label>
              <input type="password" id="lg-pass" placeholder="••••••••">
              <span class="err">Invalid credentials. Please try again.</span>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
          </form>
          ${live ? "" : `<p class="muted" style="text-align:center;margin:14px 0 6px;font-size:.82rem">Demo: admin / vikalpayati123</p>`}
          <p style="text-align:center;margin:${live ? "14px 0 0" : "0"}"><a href="index.html" style="color:var(--maroon);font-size:.88rem">← Back to store</a></p>
        </div>
      </div>`;

    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = document.getElementById("lg-user").value.trim();
      const p = document.getElementById("lg-pass").value;
      const ok = live ? await window.VikBackend.adminSignIn(u, p) : Store.adminLogin(u, p);
      if (ok) {
        currentTab = "dashboard";
        render();
      } else {
        Store.toast("Invalid credentials", "err");
        document.getElementById("lg-pass-field").classList.add("invalid");
      }
    });
    document.getElementById("lg-pass").addEventListener("input", () => {
      document.getElementById("lg-pass-field").classList.remove("invalid");
    });
  }

  /* ============================================================
     SHELL
     ============================================================ */
  function renderShell() {
    const navBtn = (key, label) =>
      `<button data-tab="${key}" class="${currentTab === key ? "active" : ""}">${label}</button>`;

    app().innerHTML = `
      <div class="admin-shell">
        <aside class="admin-side">
          ${brandLockup(true)}
          <nav class="admin-nav">
            ${navBtn("dashboard", "Dashboard")}
            ${navBtn("products", "Products")}
            ${navBtn("orders", "Orders")}
            ${navBtn("settings", "Settings")}
          </nav>
          <div style="margin-top:26px;display:flex;flex-direction:column;gap:6px">
            <a href="index.html" class="btn btn-outline btn-sm btn-block" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">View Store</a>
            <button id="logout-btn" class="btn btn-ghost btn-sm btn-block" style="color:var(--gold-soft)">Logout</button>
          </div>
        </aside>
        <main class="admin-main" id="admin-main"></main>
      </div>`;

    app().querySelectorAll(".admin-nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTab = btn.getAttribute("data-tab");
        render();
      });
    });
    document.getElementById("logout-btn").addEventListener("click", () => {
      signOut();
      render();
    });

    renderTab();
  }

  function renderTab() {
    if (currentTab === "products") renderProducts();
    else if (currentTab === "orders") renderOrders();
    else if (currentTab === "settings") renderSettings();
    else renderDashboard();
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  async function renderDashboard() {
    const main = document.getElementById("admin-main");
    const products = Store.getProducts();
    const orders = await Store.getOrders();          // live → Supabase, demo → localStorage
    const stats = Store.orderStats(orders);          // compute from the fetched list
    const recent = orders.slice(0, 6);
    const lowStock = products.filter((p) => (p.stock || 0) <= 5);

    const statCard = (lbl, val, sub) =>
      `<div class="stat"><div class="lbl">${esc(lbl)}</div><div class="val">${val}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>`;

    const recentRows = recent.length
      ? recent.map((o) => `
          <tr>
            <td><strong>${esc(o.id)}</strong></td>
            <td>${esc(o.customer && o.customer.name || "—")}</td>
            <td>${itemCount(o)}</td>
            <td>${Store.money(o.total)}</td>
            <td>${paymentBadge(o)}</td>
            <td>${statusBadge(o.status)}</td>
            <td>${esc(fmtDate(o.createdAt))}</td>
          </tr>`).join("")
      : `<tr><td colspan="7" class="muted" style="text-align:center;padding:30px">No orders yet.</td></tr>`;

    const lowRows = lowStock.length
      ? lowStock.map((p) => `
          <tr>
            <td>${esc(p.name)}</td>
            <td><strong style="color:${(p.stock || 0) <= 2 ? "var(--bad)" : "var(--warn)"}">${p.stock || 0}</strong></td>
          </tr>`).join("")
      : `<tr><td colspan="2" class="muted" style="text-align:center;padding:24px">All products well stocked.</td></tr>`;

    main.innerHTML = `
      <div class="admin-topbar">
        <h2 style="margin:0">Dashboard</h2>
        <span class="muted">${esc(todayStr())}</span>
      </div>
      <div class="stat-grid">
        ${statCard("Total Orders", stats.count)}
        ${statCard("Revenue", Store.money(stats.revenue))}
        ${statCard("Products", products.length)}
        ${statCard("Pending Orders", stats.pending)}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Recent Orders</h3></div>
        <table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${recentRows}</tbody>
        </table>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Low Stock</h3></div>
        <table>
          <thead><tr><th>Product</th><th>Stock</th></tr></thead>
          <tbody>${lowRows}</tbody>
        </table>
      </div>`;
  }

  /* ============================================================
     PRODUCTS
     ============================================================ */
  function renderProducts() {
    const main = document.getElementById("admin-main");
    const products = Store.getProducts();

    const rows = products.length
      ? products.map((p) => `
          <tr>
            <td><img class="table-thumb" src="${attr(Store.productImg(p))}" alt="${attr(p.name)}"></td>
            <td>${esc(p.name)}</td>
            <td>${esc(p.category)}</td>
            <td>${Store.money(p.price)}</td>
            <td class="muted">${Store.money(p.mrp)}</td>
            <td>${p.stock || 0}</td>
            <td style="white-space:nowrap">
              <button class="btn btn-outline btn-sm" data-edit="${attr(p.id)}">Edit</button>
              <button class="btn btn-ghost btn-sm" data-del="${attr(p.id)}" style="color:var(--bad)">Delete</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="7" class="muted" style="text-align:center;padding:30px">No products.</td></tr>`;

    main.innerHTML = `
      <div class="admin-topbar"><h2 style="margin:0">Products</h2></div>
      <div class="panel">
        <div class="panel-head">
          <h3>Products</h3>
          <button class="btn btn-primary btn-sm" id="add-product">＋ Add Product</button>
        </div>
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>MRP</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    document.getElementById("add-product").addEventListener("click", () => productModal(null));
    main.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => productModal(b.getAttribute("data-edit"))));
    main.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-del");
        const p = Store.getProduct(id);
        if (confirm(`Delete "${p ? p.name : id}"? This cannot be undone.`)) {
          Store.deleteProduct(id);
          Store.toast("Product deleted", "err");
          renderProducts();
        }
      }));
  }

  function productModal(id) {
    const editing = !!id;
    const p = editing ? (Store.getProduct(id) || {}) : {};
    const swatch = p.swatch || ["#7a1f2b", "#c79a3a"];
    const badges = ["", "Bestseller", "New", "Bridal"];

    const catOpts = CATS().map((c) =>
      `<option value="${attr(c.id)}" ${p.category === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    const badgeOpts = badges.map((b) =>
      `<option value="${attr(b)}" ${(p.badge || "") === b ? "selected" : ""}>${b === "" ? "None" : esc(b)}</option>`).join("");

    const body = `
      <form id="product-form" autocomplete="off">
        <div class="field">
          <label for="pf-name">Name</label>
          <input type="text" id="pf-name" value="${attr(p.name || "")}" required>
          <span class="err">Name is required.</span>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="pf-cat">Category</label>
            <select id="pf-cat">${catOpts}</select>
          </div>
          <div class="field">
            <label for="pf-badge">Badge</label>
            <select id="pf-badge">${badgeOpts}</select>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="pf-price">Price (₹)</label>
            <input type="number" id="pf-price" min="0" value="${attr(p.price != null ? p.price : "")}" required>
            <span class="err">Enter a valid price.</span>
          </div>
          <div class="field">
            <label for="pf-mrp">MRP (₹)</label>
            <input type="number" id="pf-mrp" min="0" value="${attr(p.mrp != null ? p.mrp : "")}">
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="pf-fabric">Fabric</label>
            <input type="text" id="pf-fabric" value="${attr(p.fabric || "")}">
          </div>
          <div class="field">
            <label for="pf-color">Colour</label>
            <input type="text" id="pf-color" value="${attr(p.color || "")}">
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="pf-stock">Stock</label>
            <input type="number" id="pf-stock" min="0" value="${attr(p.stock != null ? p.stock : 10)}">
          </div>
          <div class="field">
            <label>Swatch Colours</label>
            <div style="display:flex;gap:10px">
              <input type="color" id="pf-swa" value="${attr(swatch[0] || "#7a1f2b")}" style="height:46px;padding:4px">
              <input type="color" id="pf-swb" value="${attr(swatch[1] || "#c79a3a")}" style="height:46px;padding:4px">
            </div>
          </div>
        </div>
        <div class="field">
          <label for="pf-desc">Description</label>
          <textarea id="pf-desc" rows="3">${esc(p.desc || "")}</textarea>
        </div>
      </form>`;

    const foot = `
      <button class="btn btn-ghost btn-sm" data-close>Cancel</button>
      <button class="btn btn-primary btn-sm" id="pf-save">Save</button>`;

    openModal(editing ? "Edit Product" : "Add Product", body, foot);

    document.getElementById("pf-save").addEventListener("click", () => {
      const name = document.getElementById("pf-name").value.trim();
      const price = parseFloat(document.getElementById("pf-price").value);
      const nameField = document.getElementById("pf-name").closest(".field");
      const priceField = document.getElementById("pf-price").closest(".field");
      nameField.classList.remove("invalid");
      priceField.classList.remove("invalid");

      let ok = true;
      if (!name) { nameField.classList.add("invalid"); ok = false; }
      if (!(price >= 0) || isNaN(price)) { priceField.classList.add("invalid"); ok = false; }
      if (!ok) { Store.toast("Please fix the highlighted fields", "err"); return; }

      const mrpVal = parseFloat(document.getElementById("pf-mrp").value);
      const stockVal = parseInt(document.getElementById("pf-stock").value, 10);

      const obj = {
        id: editing ? p.id : uniqueId(slug(name)),
        name,
        category: document.getElementById("pf-cat").value,
        price,
        mrp: isNaN(mrpVal) ? price : mrpVal,
        swatch: [document.getElementById("pf-swa").value, document.getElementById("pf-swb").value],
        fabric: document.getElementById("pf-fabric").value.trim(),
        color: document.getElementById("pf-color").value.trim(),
        badge: document.getElementById("pf-badge").value,
        stock: isNaN(stockVal) ? 0 : stockVal,
        rating: editing && p.rating != null ? p.rating : 4.5,
        desc: document.getElementById("pf-desc").value.trim()
      };

      Store.saveProduct(obj);
      closeModal();
      renderProducts();
      Store.toast("Saved ❤", "ok");
    });
  }

  /* ============================================================
     ORDERS
     ============================================================ */
  const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  function statusSelect(o) {
    const opts = STATUSES.map((s) =>
      `<option value="${s}" ${o.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join("");
    return `<select class="input" data-status="${attr(o.id)}" style="min-width:150px;padding:8px 14px;font-size:.85rem">${opts}</select>`;
  }

  async function renderOrders() {
    const main = document.getElementById("admin-main");
    const orders = await Store.getOrders();
    // index by id so the detail modal can read a full order without a
    // second fetch (live mode has no single-order GET for admin).
    const byId = {};
    orders.forEach((o) => { byId[o.id] = o; });

    const rows = orders.length
      ? orders.map((o) => `
          <tr>
            <td><strong>${esc(o.id)}</strong></td>
            <td>${esc(o.customer && o.customer.name || "—")}<br><span class="muted" style="font-size:.8rem">${esc(o.customer && o.customer.phone || "")}</span></td>
            <td>${itemCount(o)}</td>
            <td>${Store.money(o.total)}</td>
            <td>${paymentBadge(o)}</td>
            <td>${statusSelect(o)}</td>
            <td>${esc(fmtDate(o.createdAt))}</td>
            <td><button class="btn btn-outline btn-sm" data-view="${attr(o.id)}">View</button></td>
          </tr>`).join("")
      : `<tr><td colspan="8" class="muted" style="text-align:center;padding:30px">No orders yet.</td></tr>`;

    main.innerHTML = `
      <div class="admin-topbar"><h2 style="margin:0">Orders</h2></div>
      <div class="panel">
        <div class="panel-head"><h3>Orders</h3></div>
        <table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>View</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    main.querySelectorAll("[data-status]").forEach((sel) =>
      sel.addEventListener("change", async () => {
        const res = await Store.updateOrderStatus(sel.getAttribute("data-status"), sel.value);
        Store.toast(res ? "Status updated" : "Could not update status", res ? "ok" : "err");
        renderOrders();
      }));
    main.querySelectorAll("[data-view]").forEach((b) =>
      b.addEventListener("click", () => orderModal(byId[b.getAttribute("data-view")])));
  }

  function orderModal(o) {
    if (!o) { Store.toast("Order not found", "err"); return; }
    const c = o.customer || {};
    const addr = [c.address, c.line1, c.line2, c.city, c.state, c.pincode, c.zip]
      .filter(Boolean).join(", ");

    const itemRows = (o.items || []).map((it) => {
      const line = it.lineTotal != null ? it.lineTotal : (it.price || 0) * (it.qty || 0);
      return `<tr>
          <td>${esc(it.name || it.id || "—")}</td>
          <td>${esc(it.size || "—")}</td>
          <td>${it.qty || 0}</td>
          <td>${Store.money(line)}</td>
        </tr>`;
    }).join("") || `<tr><td colspan="4" class="muted" style="text-align:center">No items.</td></tr>`;

    const body = `
      <div style="margin-bottom:18px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
          ${statusBadge(o.status)} ${paymentBadge(o)}
        </div>
        <strong>${esc(c.name || "—")}</strong><br>
        <span class="muted" style="font-size:.88rem">
          ${c.phone ? esc(c.phone) + "<br>" : ""}
          ${c.email ? esc(c.email) + "<br>" : ""}
          ${addr ? esc(addr) : ""}
        </span>
      </div>
      <table style="margin-bottom:16px">
        <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="font-size:.92rem">
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Subtotal</span><span>${Store.money(o.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Shipping</span><span>${Store.money(o.shipping)}</span></div>
        ${o.codFee ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">COD Fee</span><span>${Store.money(o.codFee)}</span></div>` : ""}
        ${o.discount ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Discount</span><span>- ${Store.money(o.discount)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:1px solid var(--line);font-weight:600;color:var(--maroon);font-size:1.1rem"><span>Total</span><span>${Store.money(o.total)}</span></div>
      </div>
      <div class="field" style="margin-top:18px;margin-bottom:0">
        <label>Change Status</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${STATUSES.map((s) => `<button class="btn btn-sm ${o.status === s ? "btn-primary" : "btn-outline"}" data-set-status="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join("")}
        </div>
      </div>`;

    const foot = `<button class="btn btn-ghost btn-sm" data-close>Close</button>`;
    openModal("Order " + o.id, body, foot);

    document.querySelectorAll("[data-set-status]").forEach((b) =>
      b.addEventListener("click", async () => {
        const res = await Store.updateOrderStatus(o.id, b.getAttribute("data-set-status"));
        Store.toast(res ? "Status updated" : "Could not update status", res ? "ok" : "err");
        closeModal();
        renderOrders();
      }));
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function renderSettings() {
    const main = document.getElementById("admin-main");
    const b = B();
    const admin = Store.getAdmin();

    main.innerHTML = `
      <div class="admin-topbar"><h2 style="margin:0">Settings</h2></div>
      <div class="panel">
        <div class="panel-head"><h3>Store Settings</h3></div>
        <div style="padding:22px">
          <div class="grid-2">
            <div class="field"><label>Store Name</label><input type="text" value="${attr(b.name || "")} ${attr(b.by || "")}" readonly></div>
            <div class="field"><label>WhatsApp</label><input type="text" value="${attr(b.whatsapp || "")}" readonly></div>
            <div class="field"><label>Phone</label><input type="text" value="${attr(b.phone || "")}" readonly></div>
            <div class="field"><label>Email</label><input type="text" value="${attr(b.email || "")}" readonly></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Change Admin Password</h3></div>
        <div style="padding:22px">
          <form id="admin-form" autocomplete="off">
            <div class="field"><label>Current Username</label><input type="text" id="ad-cur" value="${attr(admin.user || "")}" readonly></div>
            <div class="grid-2">
              <div class="field"><label>New Username</label><input type="text" id="ad-user" value="${attr(admin.user || "")}"></div>
              <div class="field"><label>New Password</label><input type="password" id="ad-pass" placeholder="New password"></div>
            </div>
            <div class="field" id="ad-confirm-field"><label>Confirm Password</label><input type="password" id="ad-confirm" placeholder="Re-type password"><span class="err">Passwords do not match.</span></div>
            <button type="submit" class="btn btn-primary btn-sm">Update Credentials</button>
          </form>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Data</h3></div>
        <div style="padding:22px">
          <p class="muted" style="margin-top:0">All store data (products, orders, admin credentials) is stored in this browser via localStorage. Clearing browser data will reset everything to defaults.</p>
          <button class="btn btn-outline btn-sm" id="clear-orders" style="border-color:var(--bad);color:var(--bad)">Clear All Orders</button>
        </div>
      </div>`;

    document.getElementById("admin-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("ad-user").value.trim() || admin.user;
      const pass = document.getElementById("ad-pass").value;
      const confirmPass = document.getElementById("ad-confirm").value;
      const cf = document.getElementById("ad-confirm-field");
      cf.classList.remove("invalid");

      if (!pass) { Store.toast("Enter a new password", "err"); return; }
      if (pass !== confirmPass) {
        cf.classList.add("invalid");
        Store.toast("Passwords do not match", "err");
        return;
      }
      Store.setAdmin(user, pass);
      Store.toast("Updated", "ok");
      document.getElementById("ad-pass").value = "";
      document.getElementById("ad-confirm").value = "";
      renderSettings();
    });

    document.getElementById("clear-orders").addEventListener("click", () => {
      if (confirm("Clear ALL orders? This cannot be undone.")) {
        localStorage.setItem("vik_orders", "[]");
        Store.toast("All orders cleared", "err");
        renderSettings();
      }
    });
  }

  /* ============================================================
     ROOT RENDER
     ============================================================ */
  function render() {
    closeModal();
    if (!isAuthed()) renderLogin();
    else renderShell();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
