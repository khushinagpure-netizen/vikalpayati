/* ============================================================
   VIKALPAYATI — Homepage logic
   Renders: hero contact chips, USP strip, featured grid,
   category tiles, brand value cards, stay-connected CTA.
   ============================================================ */
Store.renderNavbar('home');
Store.renderFooter();
Store.updateCartBadge();

const B = VIKALPAYATI.brand;

/* ---- canonical product card (shared with shop.js) ---- */
function cardHTML(p){
  const off=p.mrp>p.price?Math.round((p.mrp-p.price)/p.mrp*100):0;
  const bl=(p.badge||'').toLowerCase();
  const badgeCls=bl.includes('new')?'new':bl.includes('bridal')?'bridal':'';
  const catName=(VIKALPAYATI.categories.find(c=>c.id===p.category)||{}).name||p.category;
  return `<article class="card"><a class="card-media" href="product.html?id=${p.id}">${p.badge?`<span class="card-badge ${badgeCls}">${p.badge}</span>`:''}<img src="${Store.productImg(p)}" alt="${p.name}" loading="lazy"></a><div class="card-body"><span class="card-cat">${catName}</span><a href="product.html?id=${p.id}"><h3 class="card-title">${p.name}</h3></a><span class="card-rating">★ ${p.rating} · ${p.fabric}</span><div class="price-row"><span class="price">${Store.money(p.price)}</span>${p.mrp>p.price?`<span class="mrp">${Store.money(p.mrp)}</span><span class="off">${off}% off</span>`:''}</div><div class="card-actions"><button class="btn btn-primary btn-sm" onclick="Store.addToCart('${p.id}');Store.toast('Added to cart ❤')">Add to Cart</button><a class="btn btn-outline btn-sm" href="product.html?id=${p.id}">View</a></div></div></article>`;
}

/* ---- small inline SVG icons for USPs ---- */
const uspIcon = (key) => {
  const common = `width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  const paths = {
    dress: `<path d="M9 2l3 3 3-3M9 2l-1 5 4 3 4-3-1-5M8 7l-3 6 3 2M16 7l3 6-3 2M8 15v7h8v-7"/>`,
    fit:   `<path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3"/><path d="M12 3v3M12 18v3"/>`,
    heart: `<path d="M12 21s-7-4.5-9.5-9A4.8 4.8 0 0112 5a4.8 4.8 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z"/>`,
    lotus: `<path d="M12 21c-4 0-7-2-7-5 0-1 .5-2 1.5-3M12 21c4 0 7-2 7-5 0-1-.5-2-1.5-3M12 21c-2-2-3-4-3-6s1-4 3-6c2 2 3 4 3 6s-1 4-3 6zM6.5 13C5 11 5 8 6.5 6M17.5 13C19 11 19 8 17.5 6"/>`
  };
  return `<svg ${common}>${paths[key]||paths.lotus}</svg>`;
};

/* ---- USP strip ---- */
document.getElementById('usp-grid').innerHTML = B.usps.map(u =>
  `<div class="usp-item"><span class="ic">${uspIcon(u.icon)}</span><strong>${u.title}</strong><span>${u.sub}</span></div>`
).join('');

/* ---- hero contact chips ---- */
document.getElementById('hero-contact').innerHTML = `
  <a href="https://wa.me/91${B.whatsapp}" target="_blank">
    <span class="chip-ic wa"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm4.4 12c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 01-1.9-1.2 7.2 7.2 0 01-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.3-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 00-.7.3A2.8 2.8 0 006 8.9a4.8 4.8 0 001 2.5 11 11 0 004.3 3.8c2 .8 2 .5 2.4.5a2.5 2.5 0 001.6-1.1 2 2 0 00.1-1.1c0-.1-.2-.2-.5-.3z"/></svg></span>
    WhatsApp ${B.whatsapp}
  </a>
  <a href="tel:${B.phoneDial}">
    <span class="chip-ic ph"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h3l2 5-2 1a12 12 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z"/></svg></span>
    Call ${B.phone}
  </a>`;

/* ---- hero: real-photo lookbook collage ---- */
(function(){
  const pick = (id,fallbackIdx)=> Store.getProduct(id) || Store.getProducts()[fallbackIdx] || Store.getProducts()[0];
  const main = pick('leh-bridal-red',3), side = pick('sar-banarasi-red',0);
  const art = document.getElementById('hero-art');
  if(art) art.innerHTML = `
    <img class="hero-photo" src="${Store.productImg(main)}" alt="${main.name}">
    <img class="hero-photo-peek" src="${Store.productImg(side)}" alt="${side.name}">
    <span class="hero-pill">❖ Going Online · at your door ❤</span>
    <div class="hero-cap">
      <strong>VIKALPAYATI</strong><em>by Vishakha</em>
      <span class="hero-cap-line"></span>
      <small>Custom · Crafted · Timeless</small>
    </div>`;
})();

/* ---- featured grid (first 8 products) ---- */
document.getElementById('featured-grid').innerHTML =
  Store.getProducts().slice(0,8).map(cardHTML).join('');

/* ---- category tiles (real photo from a representative product) ---- */
document.getElementById('category-grid').innerHTML = VIKALPAYATI.categories.map(c => {
  const rep = Store.getProducts({category:c.id})[0];
  const img = rep ? Store.productImg(rep) : '';
  const count = Store.getProducts({category:c.id}).length;
  return `<a href="shop.html?category=${c.id}" class="cat-tile">
    <img src="${img}" alt="${rep?rep.name:c.name}" loading="lazy">
    <div class="cat-tile-cap">
      <strong>${c.name}</strong>
      <span>${count} ${count===1?'style':'styles'} · Explore →</span>
    </div>
  </a>`;
}).join('');

/* ---- brand value cards (the 4 USPs, styled light) ---- */
document.getElementById('value-grid').innerHTML = B.usps.map(u =>
  `<div style="background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:22px;box-shadow:var(--shadow)">
    <span style="color:var(--gold-deep);display:block;margin-bottom:8px">${uspIcon(u.icon)}</span>
    <strong style="font-family:var(--serif);font-size:1.2rem;display:block;color:var(--maroon)">${u.title}</strong>
    <span class="muted" style="font-size:.86rem">${u.sub}</span>
  </div>`
).join('');

/* ---- stay-connected CTA buttons ---- */
document.getElementById('connect-cta').innerHTML = `
  <a class="btn btn-gold" href="https://wa.me/91${B.whatsapp}" target="_blank">Chat on WhatsApp</a>
  <a class="btn btn-outline" href="tel:${B.phoneDial}" style="border-color:#fff;color:#fff;background:transparent">Call ${B.phone}</a>`;
