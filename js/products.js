/*
 * Zafe Chokola — product catalogue (PLACEHOLDER DATA)
 * ---------------------------------------------------
 * Edit this one file to change products, prices, and images.
 *  - id:        unique, stable slug (used as the cart key)
 *  - category:  "collection" (shown in Collections grid) or "gift" (shown in Gift Boxes)
 *  - price:     number in USD (placeholder)
 *  - stripePaymentLink: paste a Stripe Payment Link URL here later (e.g. "https://buy.stripe.com/...").
 *                       Not used yet — checkout is a placeholder.
 */
window.ZC_PRODUCTS = [
  {
    id: "signature-bonbons-9",
    category: "collection",
    name: "Signature Bonbons",
    detail: "9 pieces · hand-painted shells",
    description: "Our house assortment: salted caramel, passion fruit, toasted sesame and more.",
    price: 32,
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=900&q=80&auto=format&fit=crop",
    badge: "Bestseller",
    stripePaymentLink: ""
  },
  {
    id: "single-origin-bar",
    category: "collection",
    name: "Single-Origin 72% Bar",
    detail: "80 g · stone-ground",
    description: "Bright red-fruit notes from a single estate, finished with a slow conche.",
    price: 14,
    image: "https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=900&q=80&auto=format&fit=crop",
    badge: "",
    stripePaymentLink: ""
  },
  {
    id: "spiced-bark",
    category: "collection",
    name: "Spiced Fruit & Nut Bark",
    detail: "150 g · small batch",
    description: "Dark chocolate scattered with apricot, pistachio and a whisper of cardamom.",
    price: 18,
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=900&q=80&auto=format&fit=crop",
    badge: "Seasonal",
    stripePaymentLink: ""
  },
  {
    id: "milk-hazelnut-bar",
    category: "collection",
    name: "Milk & Roasted Hazelnut",
    detail: "80 g · 45% cacao",
    description: "Creamy milk chocolate folded with whole Piedmont-style roasted hazelnuts.",
    price: 13,
    image: "https://images.unsplash.com/photo-1542843137-8791a6904d14?w=900&q=80&auto=format&fit=crop",
    badge: "",
    stripePaymentLink: ""
  },
  {
    id: "atelier-box-16",
    category: "gift",
    name: "The Atelier Box",
    detail: "16 bonbons · keepsake box",
    description: "A curated tour of the atelier, wrapped in linen paper with a handwritten note.",
    price: 58,
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1000&q=80&auto=format&fit=crop",
    badge: "Gift favourite",
    stripePaymentLink: ""
  },
  {
    id: "grand-coffret-25",
    category: "gift",
    name: "Le Grand Coffret",
    detail: "25 bonbons · two tiers",
    description: "Our most generous assortment, made for celebrations and corporate gifting.",
    price: 89,
    image: "https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=1000&q=80&auto=format&fit=crop",
    badge: "",
    stripePaymentLink: ""
  },
  {
    id: "petit-coeur-6",
    category: "gift",
    name: "Petit Cœur",
    detail: "6 hearts · ribboned",
    description: "Six milk-chocolate hearts with a raspberry ganache centre. Small, sweet, sincere.",
    price: 24,
    image: "https://images.unsplash.com/photo-1582176604856-e824b4736522?w=1000&q=80&auto=format&fit=crop",
    badge: "",
    stripePaymentLink: ""
  }
];
