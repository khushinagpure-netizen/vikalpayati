/* ============================================================
   VIKALPAYATI — Inquiry modal (no backend)
   Self-contained: injects its own CSS + a hidden modal into <body>.
   Exposes window.openInquiry(prefill) where prefill = {interest?, message?}.
   On submit, opens the brand's WhatsApp (wa.me) or Email (mailto) with a
   pre-filled message. Works on the live site immediately (static).
   ============================================================ */
(function () {
  if (window.__vikInquiry) return; window.__vikInquiry = true;

  /* ---- brand (defensive fallbacks if data.js not loaded) ---- */
  function B() {
    return (window.VIKALPAYATI && window.VIKALPAYATI.brand) || {
      whatsapp: "9755816439",
      phone: "+91 92037 59419",
      phoneDial: "+919203759419",
      email: "hello@vikalpayati.in"
    };
  }

  var INTERESTS = [
    "General Inquiry",
    "Custom Order / Stitching",
    "Bridal Consultation",
    "Product Question",
    "Order Status",
    "Bulk / Wholesale"
  ];

  /* ---- a little extra CSS (reuses site .modal/.field classes) ---- */
  var css =
    ".vik-inq-direct{font-size:.82rem;color:var(--ink-soft,#7a6a6e);margin-top:4px}" +
    ".vik-inq-direct a{color:var(--maroon,#6d1327);font-weight:600;text-decoration:none}" +
    ".vik-inq-sub{color:var(--ink-soft,#7a6a6e);margin:0 0 16px;font-size:.92rem}" +
    ".vik-inq-wa{background:#25d366;color:#fff;border-color:#25d366}" +
    ".vik-inq-wa:hover{filter:brightness(1.05)}" +
    "@media(max-width:560px){.modal-foot .btn{flex:1}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---- modal DOM (reuses .modal-backdrop/.modal/.field/.grid-2 etc.) ---- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "vik-inquiry-backdrop";

  var b = B();
  var optsHTML = INTERESTS.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("");

  backdrop.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" aria-label="Send an Inquiry">' +
      '<div class="modal-head">' +
        "<h3>Send an Inquiry ✨</h3>" +
        '<button class="x-close" type="button" aria-label="Close" data-inq-close>×</button>' +
      "</div>" +
      '<div class="modal-body">' +
        '<p class="vik-inq-sub">Fill this &amp; we\'ll reply on WhatsApp or Email 💛</p>' +
        '<form id="vik-inq-form" novalidate>' +
          '<div class="grid-2">' +
            '<div class="field" data-f="name"><label>Your Name*</label><input type="text" id="vik-inq-name" autocomplete="name"><span class="err">Please tell us your name</span></div>' +
            '<div class="field" data-f="phone"><label>Your Phone</label><input type="tel" id="vik-inq-phone" autocomplete="tel"><span class="err">Invalid</span></div>' +
          "</div>" +
          '<div class="grid-2">' +
            '<div class="field" data-f="email"><label>Your Email</label><input type="email" id="vik-inq-email" autocomplete="email"><span class="err">Invalid</span></div>' +
            '<div class="field" data-f="interest"><label>I\'m interested in</label><select id="vik-inq-interest">' + optsHTML + "</select><span class=\"err\">Invalid</span></div>" +
          "</div>" +
          '<div class="field" data-f="message"><label>Message*</label><textarea id="vik-inq-message" rows="4" placeholder="Tell us what you\'re looking for…"></textarea><span class="err">Please add a short message</span></div>' +
          '<p class="vik-inq-direct">Or reach us directly: ' +
            '<a href="https://wa.me/91' + esc(b.whatsapp) + '" target="_blank" rel="noopener">WhatsApp ' + esc(b.whatsapp) + "</a> · " +
            '<a href="tel:' + esc(b.phoneDial || ("+91" + b.whatsapp)) + '">Call ' + esc(b.phone) + "</a>" +
          "</p>" +
        "</form>" +
      "</div>" +
      '<div class="modal-foot">' +
        '<button type="button" class="btn vik-inq-wa" data-inq-send="whatsapp">Send on WhatsApp</button>' +
        '<button type="button" class="btn btn-outline" data-inq-send="email">Send on Email</button>' +
      "</div>" +
    "</div>";

  function mount() {
    if (document.body) { document.body.appendChild(backdrop); wire(); }
    else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(backdrop); wire(); });
  }

  /* ---- helpers ---- */
  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value.trim() : ""; }
  function clearErrs() { var fs = backdrop.querySelectorAll(".field"); for (var i = 0; i < fs.length; i++) fs[i].classList.remove("invalid"); }
  function markInvalid(name) {
    var f = backdrop.querySelector('.field[data-f="' + name + '"]');
    if (f) f.classList.add("invalid");
  }

  function compose() {
    var name = val("vik-inq-name");
    var phone = val("vik-inq-phone");
    var email = val("vik-inq-email");
    var interest = (function () { var el = $("vik-inq-interest"); return el ? el.value : INTERESTS[0]; })();
    var message = val("vik-inq-message");
    var text =
      "New Inquiry — VIKALPAYATI by Vishakha\n\n" +
      "Name: " + name + "\n" +
      "Phone: " + (phone || "-") + "\n" +
      "Email: " + (email || "-") + "\n" +
      "Interested in: " + interest + "\n\n" +
      "Message:\n" + message;
    return { name: name, email: email, interest: interest, message: message, text: text };
  }

  function validate(d) {
    clearErrs();
    var ok = true;
    if (!d.name) { markInvalid("name"); ok = false; }
    if (!d.message) { markInvalid("message"); ok = false; }
    return ok;
  }

  function toast(msg) {
    if (window.Store && typeof window.Store.toast === "function") window.Store.toast(msg);
  }

  function close() { backdrop.classList.remove("open"); }

  function sendVia(channel) {
    var d = compose();
    if (!validate(d)) return;
    var br = B();
    if (channel === "whatsapp") {
      var url = "https://wa.me/91" + br.whatsapp + "?text=" + encodeURIComponent(d.text);
      window.open(url, "_blank");
      close();
      toast("Opening WhatsApp… 💛");
    } else {
      var mailto = "mailto:" + br.email +
        "?subject=" + encodeURIComponent("Inquiry: " + d.interest) +
        "&body=" + encodeURIComponent(d.text);
      window.location.href = mailto;
      close();
      toast("Opening your email… ✉");
    }
  }

  function wire() {
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();                                  // click outside
      var c = e.target.closest ? e.target.closest("[data-inq-close]") : null;
      if (c) close();
      var s = e.target.closest ? e.target.closest("[data-inq-send]") : null;
      if (s) { e.preventDefault(); sendVia(s.getAttribute("data-inq-send")); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && backdrop.classList.contains("open")) close();
    });
  }

  /* ---- public API ---- */
  window.openInquiry = function (prefill) {
    prefill = prefill || {};
    clearErrs();
    if (prefill.interest) {
      var sel = $("vik-inq-interest");
      if (sel) {
        var opts = sel.options, matched = false;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value.toLowerCase().indexOf(prefill.interest.toLowerCase()) === 0 ||
              opts[i].value.toLowerCase() === prefill.interest.toLowerCase()) { sel.selectedIndex = i; matched = true; break; }
        }
        if (!matched) for (var j = 0; j < opts.length; j++) {
          if (opts[j].value.toLowerCase().indexOf(prefill.interest.toLowerCase()) >= 0) { sel.selectedIndex = j; break; }
        }
      }
    }
    if (prefill.message) { var m = $("vik-inq-message"); if (m) m.value = prefill.message; }
    backdrop.classList.add("open");
    setTimeout(function () { var n = $("vik-inq-name"); if (n && !n.value) n.focus(); }, 60);
  };

  mount();
})();
