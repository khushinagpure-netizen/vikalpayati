/* ============================================================
   VIKALPAYATI — Store (data layer + shared UI)
   localStorage-backed. Zero server. Used by every page.
   Public API (window.Store):
     Products: getProducts(filter?), getProduct(id), saveProduct(p), deleteProduct(id)
     Cart:     getCart(), addToCart(id,qty,size), setQty(id,qty), removeFromCart(id),
               clearCart(), cartCount(), cartSubtotal(), cartItemsDetailed()
     Orders:   placeOrder(payload) -> order, getOrders(), getOrder(id),
               updateOrderStatus(id,status), orderStats()
     Auth:     adminLogin(u,p), isAdmin(), adminLogout(), getAdmin(), setAdmin(u,p)
     Money:    formatINR(n), shippingFor(subtotal)
     UI:       toast(msg,type?), productImg(p), swatchCSS(p), updateCartBadge(),
               renderNavbar(active), renderFooter(), money(n)
   ============================================================ */
(function () {
  const K = {
    products: "vik_products",
    cart: "vik_cart",
    orders: "vik_orders",
    admin: "vik_admin",
    seeded: "vik_seeded_v1"
  };
  const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------- seeding ---------- */
  function init() {
    if (!localStorage.getItem(K.seeded)) {
      write(K.products, (window.VIKALPAYATI?.products || []).map(p => ({ ...p })));
      if (!localStorage.getItem(K.cart)) write(K.cart, []);
      if (!localStorage.getItem(K.orders)) write(K.orders, []);
      if (!localStorage.getItem(K.admin)) write(K.admin, { user: "admin", pass: "vikalpayati123" });
      localStorage.setItem(K.seeded, "1");
    }
  }

  /* ---------- products ---------- */
  const getProducts = (filter) => {
    let list = read(K.products, []);
    if (filter?.category) list = list.filter(p => p.category === filter.category);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(p => (p.name + " " + p.fabric + " " + p.color).toLowerCase().includes(q));
    }
    return list;
  };
  const getProduct = (id) => read(K.products, []).find(p => p.id === id) || null;
  const saveProduct = (p) => {
    const list = read(K.products, []);
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) list[i] = { ...list[i], ...p };
    else list.push({ rating: 4.5, stock: 10, mrp: p.price, badge: "", swatch: ["#7a1f2b", "#c79a3a"], ...p });
    write(K.products, list);
    return p;
  };
  const deleteProduct = (id) => write(K.products, read(K.products, []).filter(p => p.id !== id));

  /* ---------- cart ---------- */
  const getCart = () => read(K.cart, []);
  const addToCart = (id, qty = 1, size = "Free Size") => {
    const cart = getCart();
    const row = cart.find(c => c.id === id && c.size === size);
    if (row) row.qty += qty; else cart.push({ id, qty, size });
    write(K.cart, cart);
    updateCartBadge();
    return cart;
  };
  const setQty = (id, qty, size) => {
    let cart = getCart();
    cart = cart.map(c => (c.id === id && (size === undefined || c.size === size)) ? { ...c, qty } : c)
               .filter(c => c.qty > 0);
    write(K.cart, cart); updateCartBadge(); return cart;
  };
  const removeFromCart = (id, size) => {
    write(K.cart, getCart().filter(c => !(c.id === id && (size === undefined || c.size === size))));
    updateCartBadge();
  };
  const clearCart = () => { write(K.cart, []); updateCartBadge(); };
  const cartCount = () => getCart().reduce((n, c) => n + c.qty, 0);
  const cartItemsDetailed = () => getCart().map(c => {
    const p = getProduct(c.id);
    return p ? { ...c, name: p.name, price: p.price, mrp: p.mrp, swatch: p.swatch, fabric: p.fabric, lineTotal: p.price * c.qty } : null;
  }).filter(Boolean);
  const cartSubtotal = () => cartItemsDetailed().reduce((s, i) => s + i.lineTotal, 0);

  /* ---------- money ---------- */
  const B = () => window.VIKALPAYATI?.brand || {};
  const formatINR = (n) => (B().currency || "₹") + Number(n || 0).toLocaleString("en-IN");
  const money = formatINR;
  const shippingFor = (subtotal) => (subtotal >= (B().freeShipAbove || 2999) || subtotal === 0) ? 0 : (B().shipFlat || 99);

  /* ---------- orders ---------- */
  function placeOrder(payload) {
    const orders = read(K.orders, []);
    const seq = orders.length + 1;
    const id = "VP" + String(Date.now()).slice(-6) + String(seq).padStart(2, "0");
    const order = {
      id,
      createdAt: new Date().toISOString(),
      items: payload.items,
      subtotal: payload.subtotal,
      shipping: payload.shipping,
      codFee: payload.codFee || 0,
      discount: payload.discount || 0,
      total: payload.total,
      customer: payload.customer,
      payment: payload.payment,          // {method:'cod'|'online', status:'pending'|'paid', ref?}
      status: payload.payment.method === "online" && payload.payment.status === "paid" ? "confirmed" : "pending"
    };
    orders.unshift(order);
    write(K.orders, orders);
    return order;
  }
  const getOrders = () => read(K.orders, []);
  const getOrder = (id) => read(K.orders, []).find(o => o.id === id) || null;
  const updateOrderStatus = (id, status) => {
    const orders = read(K.orders, []);
    const o = orders.find(x => x.id === id);
    if (o) { o.status = status; if (status === "delivered" && o.payment.method === "cod") o.payment.status = "paid"; write(K.orders, orders); }
    return o;
  };
  function orderStats() {
    const o = getOrders();
    const revenue = o.filter(x => x.status !== "cancelled").reduce((s, x) => s + x.total, 0);
    const byStatus = {};
    o.forEach(x => { byStatus[x.status] = (byStatus[x.status] || 0) + 1; });
    return { count: o.length, revenue, byStatus, pending: byStatus.pending || 0 };
  }

  /* ---------- admin auth ---------- */
  const getAdmin = () => read(K.admin, { user: "admin", pass: "vikalpayati123" });
  const setAdmin = (user, pass) => write(K.admin, { user, pass });
  const adminLogin = (u, p) => {
    const a = getAdmin();
    if (u === a.user && p === a.pass) { sessionStorage.setItem("vik_admin_session", "1"); return true; }
    return false;
  };
  const isAdmin = () => sessionStorage.getItem("vik_admin_session") === "1";
  const adminLogout = () => sessionStorage.removeItem("vik_admin_session");

  /* ---------- images (inline SVG gradient placeholders) ---------- */
  function productGradient(ref) {
    const p = (ref && typeof ref === "object") ? ref : (typeof ref === "string" ? getProduct(ref) : null);
    const [a, b] = (p && p.swatch) || ["#7a1f2b", "#c79a3a"];
    const label = ((p && p.fabric) || "VIKALPAYATI").replace(/&/g, "and");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760' viewBox='0 0 600 760'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
        </linearGradient>
        <pattern id='p' width='60' height='60' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
          <path d='M30 8 C38 20 52 24 52 36 C52 48 40 52 30 60 C20 52 8 48 8 36 C8 24 22 20 30 8 Z' fill='none' stroke='rgba(255,255,255,.18)' stroke-width='1.3'/>
        </pattern>
      </defs>
      <rect width='600' height='760' fill='url(#g)'/>
      <rect width='600' height='760' fill='url(#p)'/>
      <circle cx='300' cy='300' r='120' fill='none' stroke='rgba(255,255,255,.35)' stroke-width='2'/>
      <text x='300' y='312' font-family='Georgia,serif' font-size='54' fill='rgba(255,255,255,.92)' text-anchor='middle'>V</text>
      <text x='300' y='700' font-family='Georgia,serif' font-size='26' letter-spacing='3' fill='rgba(255,255,255,.85)' text-anchor='middle'>${label.toUpperCase()}</text>
    </svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }
  // Use the real photo when a product has `image`, else the gradient tile.
  function productImg(p) { return (p && p.image) ? p.image : productGradient(p); }
  // Global safety net: if any remote product photo fails to load, swap in its gradient (matched by alt=name).
  if (typeof document !== "undefined") {
    document.addEventListener("error", function (e) {
      const el = e.target;
      if (el && el.tagName === "IMG" && !el.__fbk) {
        const s = el.currentSrc || el.getAttribute("src") || "";
        if (/^https?:/i.test(s)) { el.__fbk = true; el.src = productGradient(read(K.products, []).find(x => x.name === el.alt) || null); }
      }
    }, true);
  }
  const swatchCSS = (p) => { const [a, b] = p.swatch || ["#7a1f2b", "#c79a3a"]; return `linear-gradient(135deg,${a},${b})`; };

  /* ---------- toast ---------- */
  function toast(msg, type = "ok") {
    let host = document.getElementById("vik-toast-host");
    if (!host) { host = document.createElement("div"); host.id = "vik-toast-host"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "vik-toast " + type;
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 2600);
  }

  /* ---------- shared chrome ---------- */
  function updateCartBadge() {
    document.querySelectorAll("[data-cart-badge]").forEach(b => {
      const n = cartCount();
      b.textContent = n;
      b.style.display = n > 0 ? "flex" : "none";
    });
  }
  function renderNavbar(active) {
    const host = document.querySelector("[data-navbar]");
    if (!host) return;
    const b = B();
    const link = (href, key, label) => `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
    host.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="index.html">
          <span class="brand-mark">❖</span>
          <span class="brand-text"><strong>${b.name || "VIKALPAYATI"}</strong><em>${b.by || ""}</em></span>
        </a>
        <nav class="nav-links">
          ${link("index.html", "home", "Home")}
          ${link("shop.html", "shop", "Shop")}
          ${link("shop.html?category=sarees", "sarees", "Sarees")}
          ${link("shop.html?category=bridal", "bridal", "Bridal")}
          ${link("track.html", "track", "Track Order")}
          ${link("about.html", "about", "About")}
        </nav>
        <div class="nav-actions">
          <a class="icon-btn" href="https://wa.me/91${b.whatsapp}" target="_blank" title="WhatsApp us" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1112 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 01-1.9-1.2 7.2 7.2 0 01-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.3-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 00-.7.3A2.8 2.8 0 006 8.9a4.8 4.8 0 001 2.5 11 11 0 004.3 3.8c2 .8 2 .5 2.4.5a2.5 2.5 0 001.6-1.1 2 2 0 00.1-1.1c0-.1-.2-.2-.5-.3z"/></svg>
          </a>
          <a class="icon-btn" href="cart.html" title="Cart" aria-label="Cart" style="position:relative">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M6 6L5 3H2"/></svg>
            <span class="cart-badge" data-cart-badge style="display:none">0</span>
          </a>
          <a class="icon-btn admin-link" href="admin.html" title="Admin" aria-label="Admin">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M4.5 20a7.5 7.5 0 0115 0"/></svg>
          </a>
          <button class="hamburger" aria-label="Menu" onclick="document.querySelector('[data-navbar] .nav-links').classList.toggle('open')">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>`;
    updateCartBadge();
  }
  function renderFooter() {
    const host = document.querySelector("[data-footer]");
    if (!host) return;
    const b = B();
    host.innerHTML = `
      <div class="footer-grid">
        <div>
          <div class="footer-brand"><strong>${b.name}</strong><em>${b.by}</em></div>
          <p class="muted">${b.tagline}</p>
          <p class="muted">${b.going}</p>
        </div>
        <div>
          <h4>Shop</h4>
          <a href="shop.html?category=sarees">Sarees</a>
          <a href="shop.html?category=lehengas">Lehengas</a>
          <a href="shop.html?category=suits">Suits & Kurtis</a>
          <a href="shop.html?category=bridal">Bridal Couture</a>
        </div>
        <div>
          <h4>Help</h4>
          <a href="track.html">Track Order</a>
          <a href="about.html">About Us</a>
          <a href="about.html#policy">Shipping & Returns</a>
          <a href="admin.html">Admin Login</a>
        </div>
        <div>
          <h4>Stay Connected ❤</h4>
          <a href="https://wa.me/91${b.whatsapp}" target="_blank">WhatsApp: ${b.whatsapp}</a>
          <a href="tel:${b.phoneDial}">Call: ${b.phone}</a>
          <a href="mailto:${b.email}">${b.email}</a>
          <span class="muted">${b.address}</span>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} ${b.name} ${b.by}. All rights reserved.</span>
        <span class="muted">Custom · Crafted · Timeless</span>
      </div>`;
  }

  window.Store = {
    init, getProducts, getProduct, saveProduct, deleteProduct,
    getCart, addToCart, setQty, removeFromCart, clearCart, cartCount, cartItemsDetailed, cartSubtotal,
    placeOrder, getOrders, getOrder, updateOrderStatus, orderStats,
    adminLogin, isAdmin, adminLogout, getAdmin, setAdmin,
    formatINR, money, shippingFor,
    toast, productImg, productGradient, swatchCSS, updateCartBadge, renderNavbar, renderFooter
  };
  init();
})();
