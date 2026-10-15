/* ============================================================
   VIKALPAYATI — Track Order page
   ============================================================ */
Store.renderNavbar('track');
Store.renderFooter();
Store.updateCartBadge();

const input = document.getElementById('track-id');
const result = document.getElementById('track-result');

function trackerHTML(status) {
  const steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const order = { pending: 1, confirmed: 2, shipped: 3, delivered: 4 };
  const doneTo = order[status] || 1;
  return `<div class="tracker">${steps.map((s, i) => `
    <div class="step ${i < doneTo ? 'done' : ''}">
      <div class="dot">${i < doneTo ? '✓' : i + 1}</div>${s}
    </div>`).join('')}</div>`;
}

function lookup(id) {
  const trimmed = (id || '').trim();
  if (!trimmed) {
    result.innerHTML = '';
    Store.toast('Please enter an Order ID', 'err');
    return;
  }
  const o = Store.getOrder(trimmed);
  if (!o) {
    result.innerHTML = `
      <div class="empty-state">
        <div class="ic">🔍</div>
        <h2>No order found</h2>
        <p class="muted">We couldn't find an order with ID "<strong>${trimmed}</strong>". Please check and try again.</p>
      </div>`;
    return;
  }

  const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const count = o.items.reduce((n, it) => n + it.qty, 0);

  result.innerHTML = `
    <div class="panel" style="padding:24px">
      <div class="panel-head" style="padding:0 0 16px">
        <h3>Order #${o.id}</h3>
        <span class="badge ${o.status}">${o.status}</span>
      </div>
      ${trackerHTML(o.status)}
      <div class="sum-row"><span>Placed on</span><span>${dateStr}</span></div>
      <div class="sum-row"><span>Items</span><span>${count} item${count !== 1 ? 's' : ''}</span></div>
      <div class="sum-row"><span>Payment</span><span>${o.payment.method === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
      <div class="sum-row total"><span>Total</span><span>${Store.money(o.total)}</span></div>
      <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn-outline btn-sm" href="order-confirmation.html?id=${o.id}">View Order Details</a>
      </div>
    </div>`;
}

document.getElementById('track-btn').addEventListener('click', () => lookup(input.value));
input.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(input.value); });

/* auto-run if ?id= present */
const qid = new URLSearchParams(location.search).get('id');
if (qid) { input.value = qid; lookup(qid); }
