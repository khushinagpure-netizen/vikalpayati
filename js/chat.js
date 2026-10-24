/* ============================================================
   VIKALPAYATI — "Ask us" chat widget
   Self-contained: injects its own CSS + DOM. Loads on any page
   after data.js (for brand contacts). Works standalone too.

   >>> AI UPGRADE POINT <<<
   Right now answers come from the hardcoded FAQ via getBotReply().
   To plug in AI later, make getBotReply async and call your API:
     async function getBotReply(text){
       const r = await fetch(AI_ENDPOINT,{method:'POST',
         headers:{'Content-Type':'application/json'},
         body:JSON.stringify({message:text, faq:FAQ})});
       const d = await r.json(); return d.reply;
     }
   The UI already awaits getBotReply(), so no other change is needed.
   ============================================================ */
(function () {
  if (window.__vikChat) return; window.__vikChat = true;

  var B = (window.VIKALPAYATI && window.VIKALPAYATI.brand) ||
          { whatsapp: "9755816439", phone: "+91 92037 59419", phoneDial: "+919203759419" };
  var WA = "https://wa.me/91" + B.whatsapp;

  /* ---- 10 hardcoded Q&A (AI will replace getBotReply later) ---- */
  var FAQ = [
    { q: "Do you offer custom fit / stitching?",
      a: "Yes! 🪡 Every VIKALPAYATI piece can be stitched to your measurements. Pick the <b>Custom</b> size on any product, or share your measurements on WhatsApp after ordering." },
    { q: "What are the delivery charges & time?",
      a: "Delivery is <b>FREE on orders above ₹2999</b> (flat ₹99 below that). Most orders reach you in <b>3–7 days</b> across India. Bridal/custom pieces may take a little longer — we'll confirm on WhatsApp." },
    { q: "Do you offer Cash on Delivery (COD)?",
      a: "Yes, <b>COD is available</b> (a small ₹49 handling fee applies). You can also pay online via UPI/Card at checkout." },
    { q: "What is your return / exchange policy?",
      a: "Easy <b>7-day returns/exchanges</b> on unused items with tags. 💛 Custom-stitched pieces are made just for you, so those are exchange-only for fit — just message us." },
    { q: "How do I place an order?",
      a: "Open a product → pick size & quantity → <b>Add to Cart</b> → <b>Checkout</b> → fill your address → choose COD or Online → <b>Place Order</b>. You'll get an Order ID to track. 🛍️" },
    { q: "Do you ship all over India?",
      a: "Yes, we deliver <b>pan-India</b>. For international shipping, please message us on WhatsApp for a custom quote." },
    { q: "How can I track my order?",
      a: "Go to <b>Track Order</b> and enter your Order ID (the VP… number from checkout) to see its live status." },
    { q: "Do you make bridal & custom designs?",
      a: "Absolutely — bridal lehengas, sharara & custom couture are our specialty. 👰 Explore <b>Bridal Couture</b>, or WhatsApp us for a personalised consultation." },
    { q: "What payment methods do you accept?",
      a: "UPI, Credit/Debit Cards, and Cash on Delivery. Online payments are quick & secure at checkout." },
    { q: "How do I talk to a person?",
      a: "We'd love to chat! 🤍 WhatsApp us at <b>" + B.whatsapp + "</b> or call <b>" + B.phone + "</b> — tap the button below." }
  ];

  /* ---- answer resolver (SWAP THIS FOR AI LATER — see header) ---- */
  function getBotReply(text) {
    var t = (text || "").toLowerCase().trim();
    for (var i = 0; i < FAQ.length; i++) if (FAQ[i].q.toLowerCase() === t) return FAQ[i].a;
    var kw = [
      [["custom", "fit", "stitch", "measure", "size", "alter"], 0],
      [["deliver", "ship", "charge", "days", "time", "dispatch"], 1],
      [["cod", "cash on delivery", "cash"], 2],
      [["return", "exchange", "refund"], 3],
      [["how to order", "place order", "buy", "purchase", "checkout"], 4],
      [["india", "pan", "international", "abroad", "overseas"], 5],
      [["track", "status", "where is my", "order id"], 6],
      [["bridal", "wedding", "custom design", "lehenga", "sharara"], 7],
      [["pay", "payment", "upi", "card", "online"], 8],
      [["contact", "talk", "call", "human", "person", "whatsapp", "number", "phone"], 9]
    ];
    for (var j = 0; j < kw.length; j++)
      for (var k = 0; k < kw[j][0].length; k++)
        if (t.indexOf(kw[j][0][k]) >= 0) return FAQ[kw[j][1]].a;
    return null; // unknown → handled by caller
  }

  /* ---- styles (injected) ---- */
  var css = `
  .vik-chat-fab{position:fixed;right:22px;bottom:88px;z-index:70;width:56px;height:56px;border-radius:50%;
    border:none;cursor:pointer;color:#fff;background:linear-gradient(135deg,#6d1327,#a9772a);
    box-shadow:0 10px 26px rgba(67,9,26,.4);display:flex;align-items:center;justify-content:center;transition:transform .2s}
  .vik-chat-fab:hover{transform:scale(1.08)}
  .vik-chat-fab .vcf-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;
    background:#25d366;border:2px solid #fff}
  .vik-chat-panel{position:fixed;right:22px;bottom:88px;z-index:71;width:360px;max-width:calc(100vw - 32px);
    height:520px;max-height:calc(100vh - 120px);background:#fdfaf3;border:1px solid #ecdfcd;border-radius:20px;
    box-shadow:0 26px 60px rgba(67,9,26,.3);display:none;flex-direction:column;overflow:hidden;
    font-family:'Jost',system-ui,sans-serif}
  .vik-chat-panel.open{display:flex;animation:vikChatUp .25s ease}
  @keyframes vikChatUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .vik-chat-head{background:linear-gradient(135deg,#43091a,#6d1327 60%,#a9772a);color:#fff;padding:15px 16px;
    display:flex;align-items:center;gap:11px}
  .vik-chat-head .vch-av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.15);
    display:flex;align-items:center;justify-content:center;font-size:1.2rem}
  .vik-chat-head strong{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.25rem;letter-spacing:1px;display:block;line-height:1.1}
  .vik-chat-head small{font-size:.72rem;opacity:.85}
  .vik-chat-head .vch-x{margin-left:auto;background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;line-height:1;opacity:.85}
  .vik-chat-head .vch-x:hover{opacity:1}
  .vik-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:
    radial-gradient(400px 200px at 100% 0,rgba(199,154,58,.08),transparent)}
  .vik-msg{max-width:84%;padding:10px 14px;border-radius:16px;font-size:.9rem;line-height:1.5;animation:vikChatUp .2s ease}
  .vik-msg.bot{align-self:flex-start;background:#fff;border:1px solid #ecdfcd;border-bottom-left-radius:5px;color:#2b1b1f}
  .vik-msg.bot b{color:#6d1327}
  .vik-msg.user{align-self:flex-end;background:linear-gradient(135deg,#6d1327,#581024);color:#fff;border-bottom-right-radius:5px}
  .vik-msg .vik-wa-btn{display:inline-flex;align-items:center;gap:7px;margin-top:9px;background:#25d366;color:#fff;
    padding:8px 14px;border-radius:50px;font-size:.82rem;font-weight:600;text-decoration:none}
  .vik-quick{display:flex;flex-wrap:wrap;gap:7px;padding:10px 14px;border-top:1px solid #ecdfcd;background:#faf5ec;max-height:150px;overflow-y:auto}
  .vik-quick .vq-label{width:100%;font-size:.7rem;letter-spacing:1px;text-transform:uppercase;color:#a9772a;font-weight:600;margin-bottom:2px}
  .vik-quick button{background:#fff;border:1px solid #e6cf94;color:#6d1327;font-size:.8rem;padding:7px 12px;
    border-radius:50px;cursor:pointer;font-family:inherit;transition:.15s;text-align:left}
  .vik-quick button:hover{background:#6d1327;color:#fff;border-color:#6d1327}
  .vik-chat-input{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #ecdfcd;background:#fff}
  .vik-chat-input input{flex:1;border:1.5px solid #ecdfcd;border-radius:50px;padding:10px 15px;font-family:inherit;font-size:.9rem;outline:none}
  .vik-chat-input input:focus{border-color:#c79a3a}
  .vik-chat-input button{border:none;background:linear-gradient(135deg,#6d1327,#a9772a);color:#fff;width:42px;height:42px;
    border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
  .vik-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 16px;background:#fff;border:1px solid #ecdfcd;border-radius:16px}
  .vik-typing span{width:7px;height:7px;border-radius:50%;background:#c79a3a;animation:vikBlink 1s infinite}
  .vik-typing span:nth-child(2){animation-delay:.2s}.vik-typing span:nth-child(3){animation-delay:.4s}
  @keyframes vikBlink{0%,60%,100%{opacity:.3}30%{opacity:1}}
  @media(max-width:480px){.vik-chat-panel{right:12px;left:12px;bottom:82px;width:auto;height:calc(100vh - 110px)}.vik-chat-fab{right:16px;bottom:82px}}
  `;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---- DOM ---- */
  var fab = document.createElement("button");
  fab.className = "vik-chat-fab"; fab.setAttribute("aria-label", "Ask us");
  fab.innerHTML = '<span class="vcf-dot"></span><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 01-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1121 11.5z"/><path d="M8.5 11h7M8.5 14h4"/></svg>';

  var panel = document.createElement("div");
  panel.className = "vik-chat-panel";
  panel.innerHTML =
    '<div class="vik-chat-head"><span class="vch-av">❖</span><div><strong>Ask VIKALPAYATI</strong><small>We usually reply instantly ✨</small></div><button class="vch-x" aria-label="Close">×</button></div>' +
    '<div class="vik-chat-body" id="vik-chat-body"></div>' +
    '<div class="vik-quick" id="vik-chat-quick"></div>' +
    '<form class="vik-chat-input" id="vik-chat-form"><input id="vik-chat-text" type="text" placeholder="Type your question…" autocomplete="off"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 20l18-8L3 4l0 6 12 2-12 2z"/></svg></button></form>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector("#vik-chat-body");
  var quick = panel.querySelector("#vik-chat-quick");
  var form = panel.querySelector("#vik-chat-form");
  var input = panel.querySelector("#vik-chat-text");
  var greeted = false;

  function esc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function scrollDown(){ body.scrollTop = body.scrollHeight; }

  function addMsg(html, who){
    var m = document.createElement("div"); m.className = "vik-msg " + who; m.innerHTML = html;
    body.appendChild(m); scrollDown(); return m;
  }
  function typing(){
    var t = document.createElement("div"); t.className = "vik-typing";
    t.innerHTML = "<span></span><span></span><span></span>"; body.appendChild(t); scrollDown(); return t;
  }
  function waBtn(){ return '<a class="vik-wa-btn" href="' + WA + '" target="_blank">💬 Chat on WhatsApp</a>'; }

  async function respond(text){
    var t = typing();
    await new Promise(r=>setTimeout(r, 450));                 // tiny human-like delay
    var ans = await Promise.resolve(getBotReply(text));       // async-ready for AI
    t.remove();
    if (ans) addMsg(ans, "bot");
    else addMsg("I can answer the quick questions below 👇 For anything else, our team is one tap away." + waBtn(), "bot");
  }

  function send(text){
    if (!text) return;
    addMsg(esc(text), "user");
    respond(text);
  }

  function renderQuick(){
    quick.innerHTML = '<span class="vq-label">Popular questions</span>' +
      '<button data-inq="1">📝 Send a detailed inquiry</button>' +
      FAQ.map((f,i)=>'<button data-i="'+i+'">'+esc(f.q)+'</button>').join("");
  }
  quick.addEventListener("click", function(e){
    var inq = e.target.closest("button[data-inq]");
    if (inq) { closePanel(); if (typeof window.openInquiry === "function") window.openInquiry(); return; }
    var b = e.target.closest("button[data-i]"); if(!b) return;
    var f = FAQ[+b.getAttribute("data-i")];
    addMsg(esc(f.q), "user");
    (async()=>{ var t=typing(); await new Promise(r=>setTimeout(r,400)); t.remove(); addMsg(f.a + (f.a.indexOf(B.whatsapp)>=0?waBtn():""), "bot"); })();
  });

  form.addEventListener("submit", function(e){ e.preventDefault(); var v=input.value.trim(); input.value=""; send(v); });

  function openPanel(){
    panel.classList.add("open"); fab.style.display="none";
    if(!greeted){ greeted=true;
      addMsg("Namaste 🙏 Welcome to <b>VIKALPAYATI</b>! Ask me anything, or tap a question below 👇", "bot");
      renderQuick();
    }
    setTimeout(()=>input.focus(),100);
  }
  function closePanel(){ panel.classList.remove("open"); syncVisibility(); }

  fab.addEventListener("click", openPanel);
  panel.querySelector(".vch-x").addEventListener("click", closePanel);

  /* hide on admin (multi-file admin.html or SPA #admin route) */
  function syncVisibility(){
    var hide = (location.hash || "").indexOf("#admin")===0 || /admin\.html$/.test(location.pathname);
    if (hide){ panel.classList.remove("open"); fab.style.display="none"; }
    else if (!panel.classList.contains("open")) fab.style.display="";
  }
  window.addEventListener("hashchange", syncVisibility);
  syncVisibility();
})();
