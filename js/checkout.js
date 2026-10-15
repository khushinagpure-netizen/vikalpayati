/* ============================================================
   VIKALPAYATI — Checkout page
   ============================================================ */
Store.renderNavbar('shop');
Store.renderFooter();
Store.updateCartBadge();

const root = document.getElementById('checkout-root');
const brand = VIKALPAYATI.brand;

/* Guard: empty cart → bounce to cart */
if (!Store.cartItemsDetailed().length) {
  root.innerHTML = `
    <h1>Checkout</h1>
    <div class="empty-state">
      <div class="ic">🛍</div>
      <h2>Your cart is empty</h2>
      <p class="muted">Add something lovely before checking out.</p>
      <a class="btn btn-primary" href="shop.html" style="margin-top:14px">Go to Shop</a>
    </div>`;
} else {
  buildPage();
}

function buildPage() {
  root.innerHTML = `
    <h1>Checkout</h1>
    <div class="layout-split" style="margin-top:20px">
      <div class="panel" style="padding:24px">
        <h3 style="margin-top:0">Delivery Details</h3>
        <form id="co-form" novalidate>
          <div class="field" data-f="name">
            <label for="f-name">Full Name</label>
            <input type="text" id="f-name" placeholder="Your full name">
            <span class="err">Please enter your name.</span>
          </div>
          <div class="grid-2">
            <div class="field" data-f="phone">
              <label for="f-phone">Phone</label>
              <input type="tel" id="f-phone" placeholder="10-digit mobile" maxlength="10">
              <span class="err">Enter a valid 10-digit phone.</span>
            </div>
            <div class="field" data-f="email">
              <label for="f-email">Email</label>
              <input type="email" id="f-email" placeholder="you@email.com">
              <span class="err">Enter a valid email.</span>
            </div>
          </div>
          <div class="field" data-f="address">
            <label for="f-address">Address</label>
            <textarea id="f-address" rows="3" placeholder="House no, street, area, landmark"></textarea>
            <span class="err">Please enter your address.</span>
          </div>
          <div class="grid-2">
            <div class="field" data-f="city">
              <label for="f-city">City</label>
              <input type="text" id="f-city" placeholder="City">
              <span class="err">Please enter your city.</span>
            </div>
            <div class="field" data-f="state">
              <label for="f-state">State</label>
              <input type="text" id="f-state" placeholder="State">
              <span class="err">Please enter your state.</span>
            </div>
          </div>
          <div class="field" data-f="pincode" style="max-width:220px">
            <label for="f-pincode">Pincode</label>
            <input type="text" id="f-pincode" placeholder="6-digit pincode" maxlength="6">
            <span class="err">Enter a valid 6-digit pincode.</span>
          </div>

          <h3 style="margin:22px 0 14px">Payment Method</h3>
          <label class="pay-opt active" data-pay="cod">
            <input type="radio" name="pay" value="cod" checked>
            <div>
              <div class="po-title">Cash on Delivery</div>
              <div class="po-sub">Pay ${Store.money(brand.codFee)} extra on delivery</div>
            </div>
          </label>
          <label class="pay-opt" data-pay="online">
            <input type="radio" name="pay" value="online">
            <div>
              <div class="po-title">Pay Online — UPI / Card</div>
              <div class="po-sub">Secure payment</div>
            </div>
          </label>
        </form>
      </div>

      <aside class="summary">
        <h3>Order Summary</h3>
        <div id="co-items"></div>
        <div class="sum-row"><span>Subtotal</span><span id="co-subtotal"></span></div>
        <div class="sum-row"><span>Shipping</span><span id="co-shipping"></span></div>
        <div class="sum-row" id="co-codrow"><span>COD Fee</span><span id="co-codfee"></span></div>
        <div class="sum-row total"><span>Total</span><span id="co-total"></span></div>
        <button class="btn btn-primary btn-block" type="button" id="place-order" style="margin-top:16px">Place Order</button>
      </aside>
    </div>`;

  /* payment option toggle */
  root.querySelectorAll('.pay-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      root.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      opt.querySelector('input').checked = true;
      renderSummary();
    });
  });

  renderSummary();
  document.getElementById('place-order').addEventListener('click', onPlace);
  wireModal();
}

function method() {
  const r = root.querySelector('input[name="pay"]:checked');
  return r ? r.value : 'cod';
}

function compute() {
  const items = Store.cartItemsDetailed().map(i => ({
    id: i.id, name: i.name, price: i.price, qty: i.qty, size: i.size, lineTotal: i.lineTotal
  }));
  const subtotal = Store.cartSubtotal();
  const shipping = Store.shippingFor(subtotal);
  const codFee = method() === 'cod' ? brand.codFee : 0;
  const total = subtotal + shipping + codFee;
  return { items, subtotal, shipping, codFee, total };
}

function renderSummary() {
  const { items, subtotal, shipping, codFee, total } = compute();
  document.getElementById('co-items').innerHTML = items.map(it => `
    <div class="sum-row"><span>${it.name} ×${it.qty}</span><span>${Store.money(it.lineTotal)}</span></div>`).join('') +
    `<div style="border-top:1px solid var(--line);margin:8px 0"></div>`;
  document.getElementById('co-subtotal').textContent = Store.money(subtotal);
  document.getElementById('co-shipping').textContent = shipping === 0 ? 'FREE' : Store.money(shipping);
  document.getElementById('co-codrow').style.display = codFee ? 'flex' : 'none';
  document.getElementById('co-codfee').textContent = Store.money(codFee);
  document.getElementById('co-total').textContent = Store.money(total);
}

/* ---------- validation ---------- */
function validate() {
  const v = id => document.getElementById(id).value.trim();
  const checks = {
    name: v('f-name').length > 0,
    phone: /^\d{10}$/.test(v('f-phone')),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('f-email')),
    address: v('f-address').length > 0,
    city: v('f-city').length > 0,
    state: v('f-state').length > 0,
    pincode: /^\d{6}$/.test(v('f-pincode'))
  };
  let ok = true;
  Object.keys(checks).forEach(f => {
    const field = root.querySelector(`.field[data-f="${f}"]`);
    if (checks[f]) field.classList.remove('invalid');
    else { field.classList.add('invalid'); ok = false; }
  });
  return ok;
}

function customer() {
  const v = id => document.getElementById(id).value.trim();
  return {
    name: v('f-name'), phone: v('f-phone'), email: v('f-email'),
    address: v('f-address'), city: v('f-city'), state: v('f-state'), pincode: v('f-pincode')
  };
}

/* ---------- place order ---------- */
function onPlace() {
  if (!validate()) {
    Store.toast('Please fix the highlighted fields', 'err');
    root.querySelector('.field.invalid input,.field.invalid textarea')?.focus();
    return;
  }
  if (method() === 'online') openModal();
  else finalize({ method: 'cod', status: 'pending' });
}

function finalize(payment) {
  const { items, subtotal, shipping, codFee, total } = compute();
  const order = Store.placeOrder({
    items, subtotal, shipping, codFee, total,
    customer: customer(), payment
  });
  Store.clearCart();
  Store.updateCartBadge();
  window.location = 'order-confirmation.html?id=' + order.id;
}

/* ---------- payment modal ---------- */
function wireModal() {
  const modal = document.getElementById('pay-modal');
  const close = () => modal.classList.remove('open');
  document.getElementById('pay-close').addEventListener('click', close);
  document.getElementById('pay-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  const upiTab = document.getElementById('tab-upi');
  const cardTab = document.getElementById('tab-card');
  upiTab.addEventListener('click', () => {
    upiTab.classList.add('active'); cardTab.classList.remove('active');
    document.getElementById('upi-fields').style.display = '';
    document.getElementById('card-fields').style.display = 'none';
  });
  cardTab.addEventListener('click', () => {
    cardTab.classList.add('active'); upiTab.classList.remove('active');
    document.getElementById('card-fields').style.display = '';
    document.getElementById('upi-fields').style.display = 'none';
  });

  document.getElementById('pay-now').addEventListener('click', doPay);
}

function openModal() {
  const { total } = compute();
  document.getElementById('pay-amount').textContent = Store.money(total);
  document.getElementById('pay-now').textContent = 'Pay ' + Store.money(total);
  document.getElementById('pay-modal').classList.add('open');
}

function doPay() {
  const btn = document.getElementById('pay-now');
  btn.disabled = true;
  btn.textContent = 'Processing…';
  setTimeout(() => {
    const ref = 'TXN' + String(Date.now()).slice(-6);
    finalize({ method: 'online', status: 'paid', ref });
  }, 1000);
}
