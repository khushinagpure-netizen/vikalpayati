/* ============================================================
   VIKALPAYATI — Cart page
   ============================================================ */
Store.renderNavbar('shop');
Store.renderFooter();
Store.updateCartBadge();

const root = document.getElementById('cart-root');
const brand = VIKALPAYATI.brand;

function render() {
  const items = Store.cartItemsDetailed();
  Store.updateCartBadge();

  if (!items.length) {
    root.innerHTML = `
      <h1>Your Cart</h1>
      <div class="empty-state">
        <div class="ic">🛍</div>
        <h2>Your cart is empty</h2>
        <p class="muted">Looks like you haven't added anything yet. Let's find you something beautiful.</p>
        <a class="btn btn-primary" href="shop.html" style="margin-top:14px">Start Shopping</a>
      </div>`;
    return;
  }

  const subtotal = Store.cartSubtotal();
  const shipping = Store.shippingFor(subtotal);
  const total = subtotal + shipping;
  const remaining = brand.freeShipAbove - subtotal;

  const rows = items.map(it => `
    <div class="cart-item">
      <a class="ci-media" href="product.html?id=${it.id}">
        <img src="${Store.productImg(it)}" alt="${it.name}">
      </a>
      <div>
        <a href="product.html?id=${it.id}"><div class="ci-name">${it.name}</div></a>
        <div class="ci-sub">Size: ${it.size} · ${it.fabric}</div>
        <div class="qty" style="margin-top:10px">
          <button type="button" data-act="dec" data-id="${it.id}" data-size="${it.size}">−</button>
          <input type="text" value="${it.qty}" readonly aria-label="Quantity">
          <button type="button" data-act="inc" data-id="${it.id}" data-size="${it.size}">+</button>
        </div>
      </div>
      <div class="ci-right">
        <div class="price">${Store.money(it.lineTotal)}</div>
        <div class="ci-sub">${Store.money(it.price)} each</div>
        <button class="link-danger" data-act="rm" data-id="${it.id}" data-size="${it.size}">Remove</button>
      </div>
    </div>`).join('');

  root.innerHTML = `
    <h1>Your Cart</h1>
    <div class="layout-split" style="margin-top:20px">
      <div class="cart-list">${rows}</div>
      <aside class="summary">
        <h3>Order Summary</h3>
        <div class="sum-row"><span>Subtotal</span><span>${Store.money(subtotal)}</span></div>
        <div class="sum-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : Store.money(shipping)}</span></div>
        <div class="sum-row total"><span>Total</span><span>${Store.money(total)}</span></div>
        <a class="btn btn-primary btn-block" href="checkout.html" style="margin-top:16px">Proceed to Checkout</a>
        <a class="btn btn-ghost btn-block" href="shop.html" style="margin-top:10px">Continue Shopping</a>
        <p class="muted" style="font-size:.82rem;margin-top:14px;text-align:center">
          ${shipping === 0
            ? '🎉 You have unlocked FREE shipping!'
            : `Add ${Store.money(remaining)} more for FREE shipping ❤`}
        </p>
      </aside>
    </div>`;

  root.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { act, id, size } = btn.dataset;
      const item = Store.cartItemsDetailed().find(x => x.id === id && x.size === size);
      if (act === 'rm') Store.removeFromCart(id, size);
      else if (act === 'inc') Store.setQty(id, (item ? item.qty : 1) + 1, size);
      else if (act === 'dec') Store.setQty(id, Math.max(0, (item ? item.qty : 1) - 1), size);
      render();
    });
  });
}

render();
