/* ============================================================
   VIKALPAYATI — Order confirmation page
   ============================================================ */
Store.renderNavbar('shop');
Store.renderFooter();
Store.updateCartBadge();

const root = document.getElementById('confirm-root');
const id = new URLSearchParams(location.search).get('id');

/* tracker step helper */
function trackerHTML(status) {
  const steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const order = { pending: 1, confirmed: 2, shipped: 3, delivered: 4 };
  const doneTo = order[status] || 1;
  return `<div class="tracker">${steps.map((s, i) => `
    <div class="step ${i < doneTo ? 'done' : ''}">
      <div class="dot">${i < doneTo ? '✓' : i + 1}</div>${s}
    </div>`).join('')}</div>`;
}

/* In live mode the just-placed order lives in sessionStorage (guests have
   no anon DB read); in demo mode it comes from localStorage. Both via the
   now-async Store.getOrder. */
async function resolveOrder() {
  if (!id) return null;
  if (window.VIK_LIVE) {
    try {
      const last = JSON.parse(sessionStorage.getItem('vik_last_order'));
      if (last && last.id === id) return last;
    } catch (e) {}
    return null;
  }
  return await Store.getOrder(id);
}

(async function render() {
const o = await resolveOrder();

if (!o) {
  root.innerHTML = `
    <div class="empty-state">
      <div class="ic">🔍</div>
      <h1>Order not found</h1>
      <p class="muted">We couldn't find that order. Please check the link or track by Order ID.</p>
      <a class="btn btn-primary" href="track.html" style="margin-top:14px">Track an Order</a>
    </div>`;
} else {
  const c = o.customer || {};
  const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const payMethod = o.payment.method === 'cod' ? 'Cash on Delivery' : 'Online (UPI / Card)';
  const payBadge = o.payment.status === 'paid'
    ? `<span class="badge paid">Paid</span>`
    : `<span class="badge pending">Pending</span>`;

  const itemRows = o.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>${it.size}</td>
      <td>${it.qty}</td>
      <td style="text-align:right">${Store.money(it.lineTotal)}</td>
    </tr>`).join('');

  const waText = encodeURIComponent(
    `Hi VIKALPAYATI! I just placed order ${o.id} for ${Store.money(o.total)}. Looking forward to it ❤`
  );

  root.innerHTML = `
    <div class="center" style="max-width:560px;margin:0 auto 20px">
      <div style="width:84px;height:84px;border-radius:50%;background:var(--ok);color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.6rem;margin:0 auto 18px">✔</div>
      <div class="eyebrow">Thank you!</div>
      <h1 style="margin:.1em 0">Order Placed</h1>
      <p class="muted">Order #${o.id} · ${dateStr}</p>
    </div>

    <div class="panel" style="padding:24px;max-width:860px;margin:0 auto">
      ${trackerHTML(o.status)}
    </div>

    <div class="layout-split" style="max-width:860px;margin:28px auto 0;grid-template-columns:1.6fr 1fr">
      <div class="panel" style="padding:0">
        <div class="panel-head"><h3>Order Details</h3></div>
        <table>
          <thead><tr><th>Item</th><th>Size</th><th>Qty</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="padding:16px 22px">
          <div class="sum-row"><span>Subtotal</span><span>${Store.money(o.subtotal)}</span></div>
          <div class="sum-row"><span>Shipping</span><span>${o.shipping === 0 ? 'FREE' : Store.money(o.shipping)}</span></div>
          ${o.codFee ? `<div class="sum-row"><span>COD Fee</span><span>${Store.money(o.codFee)}</span></div>` : ''}
          <div class="sum-row total"><span>Total</span><span>${Store.money(o.total)}</span></div>
        </div>
      </div>

      <aside class="summary" style="position:static">
        <h3>Payment</h3>
        <div class="sum-row"><span>Method</span><span>${payMethod}</span></div>
        <div class="sum-row"><span>Status</span><span>${payBadge}</span></div>
        ${o.payment.ref ? `<div class="sum-row"><span>Ref</span><span>${o.payment.ref}</span></div>` : ''}
        <h3 style="margin-top:18px">Delivery Address</h3>
        <p class="muted" style="font-size:.9rem;line-height:1.5;margin:0">
          <strong style="color:var(--ink)">${c.name || ''}</strong><br>
          ${c.address || ''}<br>
          ${c.city || ''}, ${c.state || ''} — ${c.pincode || ''}<br>
          📞 ${c.phone || ''}
        </p>
      </aside>
    </div>

    <div class="center" style="margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn-primary" href="track.html?id=${o.id}">Track Order</a>
      <a class="btn btn-outline" href="shop.html">Continue Shopping</a>
      <a class="btn btn-gold" href="https://wa.me/919755816439?text=${waText}" target="_blank">Share on WhatsApp</a>
    </div>`;
}
})();
