/* ============================================================
   VIKALPAYATI — About page logic
   Renders: brand values, policy cards, contact cards + CTA.
   ============================================================ */
Store.renderNavbar('about');
Store.renderFooter();
Store.updateCartBadge();

const B = VIKALPAYATI.brand;

/* ---- small inline SVG icons ---- */
const icon = (key) => {
  const c = `width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  const p = {
    dress: `<path d="M9 2l3 3 3-3M9 2l-1 5 4 3 4-3-1-5M8 7l-3 6 3 2M16 7l3 6-3 2M8 15v7h8v-7"/>`,
    fit:   `<path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3"/><path d="M12 3v3M12 18v3"/>`,
    heart: `<path d="M12 21s-7-4.5-9.5-9A4.8 4.8 0 0112 5a4.8 4.8 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z"/>`,
    lotus: `<path d="M12 21c-4 0-7-2-7-5 0-1 .5-2 1.5-3M12 21c4 0 7-2 7-5 0-1-.5-2-1.5-3M12 21c-2-2-3-4-3-6s1-4 3-6c2 2 3 4 3 6s-1 4-3 6zM6.5 13C5 11 5 8 6.5 6M17.5 13C19 11 19 8 17.5 6"/>`,
    ship:  `<path d="M3 13h11V6H3zM14 9h4l3 3v4h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z"/>`,
    cod:   `<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 10v4M18 10v4"/>`,
    ret:   `<path d="M3 12a9 9 0 109-9 9 9 0 00-6.5 2.8M3 4v4h4"/>`,
    cut:   `<path d="M6 6l12 12M6 18l12-12M9 9a2.5 2.5 0 10-3-3 2.5 2.5 0 003 3zM9 15a2.5 2.5 0 11-3 3 2.5 2.5 0 013-3z"/>`,
    wa:    `<path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2z"/>`,
    phone: `<path d="M6 3h3l2 5-2 1a12 12 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z"/>`,
    mail:  `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>`,
    insta: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>`,
    pin:   `<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>`
  };
  return `<svg ${c}>${p[key]||p.lotus}</svg>`;
};

/* ---- 4 brand values ---- */
document.getElementById('value-grid').innerHTML = B.usps.map(u =>
  `<div style="background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px;box-shadow:var(--shadow);text-align:center">
    <span style="color:var(--gold-deep);display:flex;justify-content:center;margin-bottom:10px">${icon(u.icon)}</span>
    <strong style="font-family:var(--serif);font-size:1.25rem;display:block;color:var(--maroon)">${u.title}</strong>
    <span class="muted" style="font-size:.88rem">${u.sub}</span>
  </div>`
).join('');

/* ---- policy cards ---- */
const policies = [
  { ic:'ship', title:'Shipping', body:`Free shipping on all orders above ${Store.money(B.freeShipAbove)}. A flat ${Store.money(B.shipFlat)} applies below that. Orders are dispatched pan-India once your piece is ready.` },
  { ic:'cod',  title:'Cash on Delivery', body:`COD is available across India with a small handling fee of ${Store.money(B.codFee)} per order. Prefer to pay online? Secure prepaid options are available at checkout.` },
  { ic:'ret',  title:'7-Day Easy Returns', body:`Not in love with it? Request a return within 7 days of delivery for ready-to-wear pieces, in original condition with tags intact.` },
  { ic:'cut',  title:'Custom-Fit Stitching', body:`Many pieces are stitched to your measurements. Custom-fit and altered orders are made just for you, so they fall outside the standard return window — message us and we'll make it right.` }
];
document.getElementById('policy-grid').innerHTML = policies.map(p =>
  `<div style="background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px;box-shadow:var(--shadow)">
    <span style="color:var(--maroon);display:block;margin-bottom:10px">${icon(p.ic)}</span>
    <h3 style="font-size:1.3rem;margin-bottom:8px">${p.title}</h3>
    <p class="muted" style="margin:0">${p.body}</p>
  </div>`
).join('');

/* ---- contact cards ---- */
const tile = (ic, label, value, href, ext) =>
  `<a href="${href}"${ext?' target="_blank"':''} style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:var(--radius);padding:24px;text-align:center;color:var(--cream);transition:.2s">
    <span style="color:var(--gold-soft);display:flex;justify-content:center;margin-bottom:10px">${icon(ic)}</span>
    <strong style="font-family:var(--serif);font-size:1.2rem;display:block;color:#fff">${label}</strong>
    <span style="font-size:.9rem;color:rgba(247,239,228,.85)">${value}</span>
  </a>`;

document.getElementById('contact-grid').innerHTML = [
  tile('wa',    'WhatsApp',  B.whatsapp,          `https://wa.me/91${B.whatsapp}`, true),
  tile('phone', 'Call Us',   B.phone,             `tel:${B.phoneDial}`, false),
  tile('mail',  'Email',     B.email,             `mailto:${B.email}`, false),
  tile('insta', 'Instagram', '@'+B.instagram,     `https://instagram.com/${B.instagram}`, true),
  tile('pin',   'Visit',     B.address,           `https://maps.google.com/?q=${encodeURIComponent(B.address)}`, true)
].join('');

/* ---- contact CTA buttons ---- */
document.getElementById('contact-cta').innerHTML = `
  <a class="btn btn-gold" href="https://wa.me/91${B.whatsapp}" target="_blank">Message on WhatsApp</a>
  <a class="btn btn-outline" href="tel:${B.phoneDial}" style="border-color:#fff;color:#fff;background:transparent">Call ${B.phone}</a>`;
