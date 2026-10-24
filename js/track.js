/* ============================================================
   VIKALPAYATI — Track Order page (DUAL-MODE)
   Demo: localStorage lookup by Order ID (phone optional/ignored).
   Live: edge-fn lookup by Order ID + Phone (ownership-verified).
   ============================================================ */
Store.renderNavbar('track');
Store.renderFooter();
Store.updateCartBadge();

const input = document.getElementById('track-id');
const result = document.getElementById('track-result');

/* In live mode a phone number is required (ownership check in the edge
   function); inject the field right after the Order ID field so the
   existing HTML needs no edit. */
let phoneInput = null;
if (window.VIK_LIVE) {
  const idField = input.closest('.field');
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.style.marginBottom = '12px';
  wrap.innerHTML =
    '<label for="track-phone">Phone (used on the order)</label>' +
    '<input type="tel" id="track-phone" placeholder="10-digit mobile" maxlength="10">';
  idField.insertAdjacentElement('afterend', wrap);
  phoneInput = document.getElementById('track-phone');
}

function trackerHTML(status) {
  const steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const order = { pending: 1, confirmed: 2, shipped: 3, delivered: 4 };
  const doneTo = order[status] || 1;
  return `<div class="tracker">${steps.map((s, i) => `
    <div class="step ${i < doneTo ? 'done' : ''}">
      <div class="dot">${i < doneTo ? '✓' : i + 1}</div>${s}
    </div>`).join('')}</div>`;
}

function notFound(trimmed) {
  result.innerHTML = `
    <div class="empty-state">
      <div class="ic">🔍</div>
      <h2>No order found</h2>
      <p class="muted">We couldn't find an order with ID "<strong>${trimmed}</strong>"${window.VIK_LIVE ? ' and that phone number' : ''}. Please check and try again.</p>
    </div>`;
}

/* Render from a full (demo) order or the safe (live) subset. Both carry
   id, status, createdAt, total, payment.method; demo also has items[]. */
function renderOrder(o) {
  const dateStr = o.createdAt
    ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const count = Array.isArray(o.items)
    ? o.items.reduce((n, it) => n + it.qty, 0)
    : (o.itemsCount != null ? o.itemsCount : 0);
  const payMethod = o.payment && o.payment.method === 'cod' ? 'Cash on Delivery' : 'Online';

  result.innerHTML = `
    <div class="panel" style="padding:24px">
      <div class="panel-head" style="padding:0 0 16px">
        <h3>Order #${o.id}</h3>
        <span class="badge ${o.status}">${o.status}</span>
      </div>
      ${trackerHTML(o.status)}
      <div class="sum-row"><span>Placed on</span><span>${dateStr}</span></div>
      <div class="sum-row"><span>Items</span><span>${count} item${count !== 1 ? 's' : ''}</span></div>
      <div class="sum-row"><span>Payment</span><span>${payMethod}</span></div>
      <div class="sum-row total"><span>Total</span><span>${Store.money(o.total)}</span></div>
      ${!window.VIK_LIVE ? `<div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn-outline btn-sm" href="order-confirmation.html?id=${o.id}">View Order Details</a>
      </div>` : ''}
    </div>`;
}

async function lookup(id) {
  const trimmed = (id || '').trim();
  if (!trimmed) {
    result.innerHTML = '';
    Store.toast('Please enter an Order ID', 'err');
    return;
  }

  if (window.VIK_LIVE) {
    const phone = (phoneInput && phoneInput.value || '').trim();
    if (!phone) {
      Store.toast('Please enter the phone number used on the order', 'err');
      return;
    }
    result.innerHTML = '<p class="muted center">Looking up your order…</p>';
    const o = await VikBackend.getOrderGuest(trimmed, phone);
    if (!o) { notFound(trimmed); return; }
    renderOrder(o);
    return;
  }

  const o = await Store.getOrder(trimmed);
  if (!o) { notFound(trimmed); return; }
  renderOrder(o);
}

document.getElementById('track-btn').addEventListener('click', () => lookup(input.value));
input.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(input.value); });
if (phoneInput) phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(input.value); });

/* auto-run if ?id= present (demo only — live needs a phone) */
const qid = new URLSearchParams(location.search).get('id');
if (qid) { input.value = qid; if (!window.VIK_LIVE) lookup(qid); }
