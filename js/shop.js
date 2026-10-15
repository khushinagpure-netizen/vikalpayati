/* ============================================================
   VIKALPAYATI — Shop / catalog logic
   URL-driven filtering (?category= & ?q=), search, sort.
   State persists to URL via history.replaceState.
   ============================================================ */
Store.renderNavbar('shop');
Store.renderFooter();
Store.updateCartBadge();

/* ---- canonical product card (shared with home.js) ---- */
function cardHTML(p){
  const off=p.mrp>p.price?Math.round((p.mrp-p.price)/p.mrp*100):0;
  const bl=(p.badge||'').toLowerCase();
  const badgeCls=bl.includes('new')?'new':bl.includes('bridal')?'bridal':'';
  const catName=(VIKALPAYATI.categories.find(c=>c.id===p.category)||{}).name||p.category;
  return `<article class="card"><a class="card-media" href="product.html?id=${p.id}">${p.badge?`<span class="card-badge ${badgeCls}">${p.badge}</span>`:''}<img src="${Store.productImg(p)}" alt="${p.name}" loading="lazy"></a><div class="card-body"><span class="card-cat">${catName}</span><a href="product.html?id=${p.id}"><h3 class="card-title">${p.name}</h3></a><span class="card-rating">★ ${p.rating} · ${p.fabric}</span><div class="price-row"><span class="price">${Store.money(p.price)}</span>${p.mrp>p.price?`<span class="mrp">${Store.money(p.mrp)}</span><span class="off">${off}% off</span>`:''}</div><div class="card-actions"><button class="btn btn-primary btn-sm" onclick="Store.addToCart('${p.id}');Store.toast('Added to cart ❤')">Add to Cart</button><a class="btn btn-outline btn-sm" href="product.html?id=${p.id}">View</a></div></div></article>`;
}

/* ---- state seeded from URL ---- */
const params = new URLSearchParams(location.search);
const state = {
  category: params.get('category') || 'all',
  q: params.get('q') || '',
  sort: params.get('sort') || 'featured'
};

const els = {
  chips: document.getElementById('chips'),
  grid:  document.getElementById('shop-grid'),
  count: document.getElementById('result-count'),
  empty: document.getElementById('empty'),
  q:     document.getElementById('q'),
  sort:  document.getElementById('sort')
};

/* sync controls with incoming URL state */
els.q.value = state.q;
els.sort.value = state.sort;

/* ---- chips (All + one per category) ---- */
function renderChips(){
  const cats = [{id:'all', name:'All'}, ...VIKALPAYATI.categories];
  els.chips.innerHTML = cats.map(c =>
    `<button class="chip ${state.category===c.id?'active':''}" data-cat="${c.id}">${c.name}</button>`
  ).join('');
  els.chips.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => { state.category = btn.dataset.cat; apply(); });
  });
}

/* ---- sort helper ---- */
function sortList(list){
  const a = list.slice();
  switch(state.sort){
    case 'price-asc':  a.sort((x,y)=>x.price-y.price); break;
    case 'price-desc': a.sort((x,y)=>y.price-x.price); break;
    case 'rating':     a.sort((x,y)=>y.rating-x.rating); break;
    case 'newest':
      a.sort((x,y)=>((y.badge||'').toLowerCase().includes('new')?1:0)-((x.badge||'').toLowerCase().includes('new')?1:0));
      break;
    // 'featured' = store order (bestsellers first as seeded)
  }
  return a;
}

/* ---- sync URL to state (so category links & refresh work) ---- */
function syncURL(){
  const p = new URLSearchParams();
  if (state.category && state.category !== 'all') p.set('category', state.category);
  if (state.q) p.set('q', state.q);
  if (state.sort && state.sort !== 'featured') p.set('sort', state.sort);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/* ---- main render ---- */
function apply(){
  const filter = {};
  if (state.category !== 'all') filter.category = state.category;
  if (state.q) filter.q = state.q;

  const list = sortList(Store.getProducts(filter));

  els.grid.innerHTML = list.map(cardHTML).join('');
  els.empty.style.display = list.length ? 'none' : 'block';
  const catName = state.category==='all' ? 'all collections'
    : ((VIKALPAYATI.categories.find(c=>c.id===state.category)||{}).name || state.category);
  els.count.textContent = `${list.length} ${list.length===1?'piece':'pieces'} in ${catName}${state.q?` · “${state.q}”`:''}`;

  renderChips();
  syncURL();
}

/* ---- events ---- */
let qTimer;
els.q.addEventListener('input', () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { state.q = els.q.value.trim(); apply(); }, 180);
});
els.sort.addEventListener('change', () => { state.sort = els.sort.value; apply(); });

/* exposed for the empty-state "Clear Filters" button */
window.resetShop = () => {
  state.category = 'all'; state.q = ''; state.sort = 'featured';
  els.q.value = ''; els.sort.value = 'featured';
  apply();
};

/* ---- initial paint ---- */
apply();
