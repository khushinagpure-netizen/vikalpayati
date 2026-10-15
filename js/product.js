/* ============================================================
   VIKALPAYATI — Product detail page
   ============================================================ */
Store.renderNavbar('shop');
Store.renderFooter();
Store.updateCartBadge();

function cardHTML(p){const off=p.mrp>p.price?Math.round((p.mrp-p.price)/p.mrp*100):0;const bl=(p.badge||'').toLowerCase();const badgeCls=bl.includes('new')?'new':bl.includes('bridal')?'bridal':'';const catName=(VIKALPAYATI.categories.find(c=>c.id===p.category)||{}).name||p.category;return `<article class="card"><a class="card-media" href="product.html?id=${p.id}">${p.badge?`<span class="card-badge ${badgeCls}">${p.badge}</span>`:''}<img src="${Store.productImg(p)}" alt="${p.name}" loading="lazy"></a><div class="card-body"><span class="card-cat">${catName}</span><a href="product.html?id=${p.id}"><h3 class="card-title">${p.name}</h3></a><span class="card-rating">★ ${p.rating} · ${p.fabric}</span><div class="price-row"><span class="price">${Store.money(p.price)}</span>${p.mrp>p.price?`<span class="mrp">${Store.money(p.mrp)}</span><span class="off">${off}% off</span>`:''}</div><div class="card-actions"><button class="btn btn-primary btn-sm" onclick="Store.addToCart('${p.id}');Store.toast('Added to cart ❤')">Add to Cart</button><a class="btn btn-outline btn-sm" href="product.html?id=${p.id}">View</a></div></div></article>`;}

const root = document.getElementById('pd-root');
const id = new URLSearchParams(location.search).get('id');
const p = id ? Store.getProduct(id) : null;

if (!p) {
  document.title = 'Product not found — VIKALPAYATI by Vishakha';
  root.innerHTML = `
    <div class="empty-state">
      <div class="ic">❤</div>
      <h1>Product not found</h1>
      <p class="muted">We couldn't find that piece. It may have been moved or sold out.</p>
      <a class="btn btn-primary" href="shop.html" style="margin-top:14px">Back to Shop</a>
    </div>`;
} else {
  document.title = p.name + ' — VIKALPAYATI by Vishakha';
  const off = p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : 0;
  const catName = (VIKALPAYATI.categories.find(c => c.id === p.category) || {}).name || p.category;
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'Custom'];
  const stockRow = p.stock > 0
    ? `<div class="row">📦 In stock · ${p.stock} available</div>`
    : `<div class="row">🧵 Made to order</div>`;

  root.innerHTML = `
    <div class="pd">
      <div class="pd-media">
        <img src="${Store.productImg(p)}" alt="${p.name}">
      </div>
      <div class="pd-info">
        <span class="card-cat">${catName}</span>
        <h1>${p.name}</h1>
        <div class="card-rating">★ ${p.rating}</div>
        <div class="pd-price">
          <span class="price">${Store.money(p.price)}</span>
          ${p.mrp > p.price ? `<span class="mrp">${Store.money(p.mrp)}</span><span class="off">${off}% off</span>` : ''}
        </div>
        <p class="muted">${p.desc || ''}</p>
        <div class="pd-fabric">
          <span class="tag">Fabric · ${p.fabric}</span>
          <span class="tag">Colour · ${p.color}</span>
          <span class="tag">Custom fit available</span>
        </div>
        <div>
          <label style="display:block;font-size:.85rem;font-weight:500;margin-bottom:4px">Select Size</label>
          <div class="size-row" id="size-row">
            ${sizes.map(s => `<button class="size-opt" data-size="${s}" type="button">${s}</button>`).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin:16px 0">
          <div class="qty" id="qty">
            <button type="button" id="q-dec">−</button>
            <input type="text" id="q-val" value="1" readonly aria-label="Quantity">
            <button type="button" id="q-inc">+</button>
          </div>
        </div>
        <div class="pd-actions">
          <button class="btn btn-primary" id="add-cart">Add to Cart</button>
          <button class="btn btn-gold" id="buy-now">Buy Now</button>
        </div>
        <div class="pd-meta">
          <div class="row">🚚 Delivery in 3–7 days · Free above ₹2999</div>
          <div class="row">💵 Cash on Delivery available</div>
          <div class="row">↩ 7-day easy returns</div>
          ${stockRow}
        </div>
      </div>
    </div>

    <section class="section" style="padding-bottom:0">
      <div class="section-head">
        <div class="eyebrow">Handpicked for you</div>
        <h2>You may also like</h2>
      </div>
      <div class="grid grid-products" id="related-grid"></div>
    </section>`;

  /* size selector — default Free Size when none chosen */
  let chosenSize = 'Free Size';
  const sizeRow = document.getElementById('size-row');
  sizeRow.querySelectorAll('.size-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      sizeRow.querySelectorAll('.size-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenSize = btn.dataset.size;
    });
  });

  /* qty stepper */
  const qVal = document.getElementById('q-val');
  const getQty = () => Math.max(1, parseInt(qVal.value, 10) || 1);
  document.getElementById('q-dec').addEventListener('click', () => { qVal.value = Math.max(1, getQty() - 1); });
  document.getElementById('q-inc').addEventListener('click', () => { qVal.value = getQty() + 1; });

  /* actions */
  document.getElementById('add-cart').addEventListener('click', () => {
    Store.addToCart(p.id, getQty(), chosenSize);
    Store.updateCartBadge();
    Store.toast('Added to cart ❤');
  });
  document.getElementById('buy-now').addEventListener('click', () => {
    Store.addToCart(p.id, getQty(), chosenSize);
    Store.updateCartBadge();
    location.href = 'checkout.html';
  });

  /* related products — same category, fallback to any others */
  let related = Store.getProducts({ category: p.category }).filter(x => x.id !== p.id);
  if (related.length < 4) {
    const extra = Store.getProducts().filter(x => x.id !== p.id && x.category !== p.category);
    related = related.concat(extra);
  }
  document.getElementById('related-grid').innerHTML = related.slice(0, 4).map(cardHTML).join('');
}
