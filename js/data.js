/* ============================================================
   VIKALPAYATI by Vishakha — seed data & brand config
   This file only SEEDS defaults. Live data lives in localStorage
   and is managed by store.js. Editing a product in Admin persists
   to localStorage, not here.
   ============================================================ */

const VIKALPAYATI = {
  brand: {
    name: "VIKALPAYATI",
    by: "by Vishakha",
    tagline: "Custom · Crafted · Timeless",
    going: "is going Online, at your door",
    whatsapp: "9755816439",
    phone: "+91 92037 59419",
    phoneDial: "+919203759419",
    email: "hello@vikalpayati.in",
    instagram: "vikalpayati",
    address: "Bhopal, Madhya Pradesh, India",
    currency: "₹",
    freeShipAbove: 2999,
    shipFlat: 99,
    codFee: 49,
    usps: [
      { icon: "dress",  title: "Designer Wear",            sub: "Curated couture" },
      { icon: "fit",    title: "Custom Fit",               sub: "Stitched to you" },
      { icon: "heart",  title: "Personalised Service",     sub: "One-on-one care" },
      { icon: "lotus",  title: "Tradition + Modern Touch", sub: "Rooted, reimagined" }
    ]
  },

  categories: [
    { id: "sarees",   name: "Sarees" },
    { id: "lehengas", name: "Lehengas" },
    { id: "suits",    name: "Suits & Kurtis" },
    { id: "dupattas", name: "Dupattas & Stoles" },
    { id: "bridal",   name: "Bridal Couture" }
  ],

  /* Images are elegant CSS-gradient placeholders (no photos yet).
     `swatch` = [colorA, colorB] drives the gradient tile.
     Replace `image` with a real URL/path anytime and it will be used. */
  products: [
    { id: "sar-banarasi-red",   name: "Banarasi Silk Saree — Maroon & Gold", category: "sarees",   price: 4999, mrp: 7499, swatch: ["#7a1f2b","#c79a3a"], image: "https://images.pexels.com/photos/17113983/pexels-photo-17113983.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Pure Banarasi Silk", color: "Maroon", badge: "Bestseller", stock: 8,  rating: 4.8, desc: "Handwoven Banarasi silk with intricate gold zari motifs. A timeless drape for weddings and festive occasions." },
    { id: "sar-kanjivaram-grn", name: "Kanjivaram Saree — Emerald",          category: "sarees",   price: 6299, mrp: 8999, swatch: ["#0f5132","#c79a3a"], image: "https://images.pexels.com/photos/35586011/pexels-photo-35586011.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Kanjivaram Silk",    color: "Emerald", badge: "New", stock: 5,  rating: 4.9, desc: "South-Indian Kanjivaram weave with a contrast gold border. Rich, regal and heirloom-worthy." },
    { id: "sar-chiffon-blush",  name: "Chiffon Saree — Blush Pink",          category: "sarees",   price: 2499, mrp: 3499, swatch: ["#d98a9e","#f3e4d7"], image: "https://images.pexels.com/photos/33067044/pexels-photo-33067044.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Chiffon",           color: "Blush", badge: "", stock: 12, rating: 4.6, desc: "Featherlight chiffon with a delicate sequin pallu. Effortless elegance for cocktail evenings." },
    { id: "leh-bridal-red",     name: "Bridal Lehenga — Crimson Zardozi",    category: "lehengas", price: 18999, mrp: 26999, swatch: ["#8b0000","#c79a3a"], image: "https://images.pexels.com/photos/25811178/pexels-photo-25811178.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Raw Silk + Zardozi", color: "Crimson", badge: "Bridal", stock: 3, rating: 5.0, desc: "A show-stopping crimson lehenga with hand-done zardozi and a heavily flared ghera. Made for the main day." },
    { id: "leh-pastel-mint",    name: "Lehenga — Pastel Mint Threadwork",    category: "lehengas", price: 9499, mrp: 13999, swatch: ["#9fd8c3","#f3e4d7"], image: "https://images.pexels.com/photos/40195823/pexels-photo-40195823.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Georgette",         color: "Mint", badge: "", stock: 6, rating: 4.7, desc: "Soft mint georgette with pastel resham threadwork. Perfect for mehndi and daytime functions." },
    { id: "suit-anarkali-wine", name: "Anarkali Suit — Wine Floor Length",   category: "suits",    price: 5499, mrp: 7999, swatch: ["#5e2129","#c79a3a"], image: "https://images.pexels.com/photos/30268122/pexels-photo-30268122.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Velvet",            color: "Wine", badge: "Bestseller", stock: 7, rating: 4.8, desc: "Floor-length wine velvet Anarkali with a gold-embellished yoke and matching dupatta." },
    { id: "suit-cotton-indigo", name: "Cotton Kurti Set — Indigo Block",     category: "suits",    price: 1899, mrp: 2699, swatch: ["#2b3a67","#eadfce"], image: "https://images.pexels.com/photos/20690516/pexels-photo-20690516.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Handblock Cotton",  color: "Indigo", badge: "", stock: 20, rating: 4.5, desc: "Breathable handblock-printed cotton kurti with pants. Everyday grace, hand-crafted in India." },
    { id: "suit-chanderi-gold", name: "Chanderi Suit — Ivory & Gold",        category: "suits",    price: 3299, mrp: 4599, swatch: ["#efe6d0","#c79a3a"], image: "https://images.pexels.com/photos/37054351/pexels-photo-37054351.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Chanderi Silk",     color: "Ivory", badge: "New", stock: 9, rating: 4.7, desc: "Luminous ivory Chanderi with fine gold buttis. Understated festive luxury." },
    { id: "dup-phulkari",       name: "Phulkari Dupatta — Rani Pink",        category: "dupattas", price: 1299, mrp: 1899, swatch: ["#b3295f","#c79a3a"], image: "https://images.pexels.com/photos/13584935/pexels-photo-13584935.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Georgette",         color: "Rani Pink", badge: "", stock: 15, rating: 4.6, desc: "Vibrant Phulkari embroidery on a flowy georgette base. The statement piece your wardrobe needs." },
    { id: "dup-organza-ivory",  name: "Organza Stole — Ivory Gota",          category: "dupattas", price: 999,  mrp: 1499, swatch: ["#f3e4d7","#c79a3a"], image: "https://images.pexels.com/photos/36266671/pexels-photo-36266671.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Organza",           color: "Ivory", badge: "", stock: 18, rating: 4.4, desc: "Sheer organza stole edged with delicate gota lace. Drapes beautifully over any outfit." },
    { id: "bri-sharara-gold",   name: "Bridal Sharara — Antique Gold",       category: "bridal",   price: 15999, mrp: 22999, swatch: ["#b8860b","#7a1f2b"], image: "https://images.pexels.com/photos/29128064/pexels-photo-29128064.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Silk + Gota Patti", color: "Antique Gold", badge: "Bridal", stock: 2, rating: 5.0, desc: "Regal antique-gold sharara with intricate gota-patti. For the bride who loves tradition with flair." },
    { id: "bri-velvet-maroon",  name: "Bridal Gown — Maroon Velvet",         category: "bridal",   price: 13499, mrp: 18999, swatch: ["#4a0e1a","#c79a3a"], image: "https://images.pexels.com/photos/31832873/pexels-photo-31832873.jpeg?auto=compress&cs=tinysrgb&w=600&h=760&fit=crop", fabric: "Velvet + Stonework", color: "Maroon", badge: "New", stock: 4, rating: 4.9, desc: "Deep maroon velvet gown with hand-set stonework and a sweeping train. Modern bridal drama." }
  ]
};

if (typeof window !== "undefined") window.VIKALPAYATI = VIKALPAYATI;
