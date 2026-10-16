/*
 * Zafe Chokola — product catalogue (single source of truth)
 * ----------------------------------------------------------
 * Products and prices come from the owner's questionnaire (Oct 1, 2026).
 * Edit this one file to change products, prices and images.
 *  - id:        unique, stable slug (used as the cart key; don't reuse/rename casually)
 *  - category:  "collection" (shown in the Shop grid)
 *  - name / detail / description: card copy (no ingredient claims unless the owner confirms them)
 *  - price:     number in USD
 *  - image:     local photo slot (relative path). Drop the real photo in at this exact path
 *               to replace the stock placeholder — no code change needed.
 *  - fallback:  stock (Unsplash) image used automatically if the local file is missing.
 *  - badge:     optional corner label; "" for none
 *  - stripePaymentLink: Stripe Payment Link URL (https://buy.stripe.com/...). When set, the card gets a "Buy now" button.
 *
 * LIVE CATALOGUE: the site normally reads products from the Google Sheet
 * "Zafe Chokola - Products (edit me)" (see ZC_SHEET below and HANDOFF.md). This list is the
 * instant FALLBACK, used when the sheet can't be reached within ZC_SHEET.timeoutMs.
 * Sheet rows whose Name matches a product here (same slug, e.g. "Spooky Bars" -> spooky-bars)
 * reuse its local photo as a backup if the sheet's photo fails to load.
 */
window.ZC_SHEET = {
  id: "10kDmLhHrREoqNFyllBuvo9YnMyxJG_Vj1IQW-Q_H6_8", // "" turns the sheet off (fallback list only)
  tab: "Products",
  timeoutMs: 3000
};
window.ZC_PRODUCTS = [
  {
    id: "spooky-bars",
    category: "collection",
    name: "Spooky Bars",
    detail: "Halloween favourite",
    description: "Playful, spooky-season chocolate bars made to bring a grin to trick-or-treaters of every age. A frightfully fun treat for sharing \u2014 or not!",
    price: 8,
    image: "images/products/spooky-bars.jpg",
    fallback: "https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=900&q=80&auto=format&fit=crop",
    badge: "Halloween",
    stripePaymentLink: ""
  },
  {
    id: "pumpkin-bites",
    category: "collection",
    name: "Pumpkin Bites",
    detail: "Seasonal treat",
    description: "Bite-sized chocolates inspired by pumpkin season \u2014 a cosy little celebration of autumn, perfect for sharing or tucking into a thoughtful gift.",
    price: 20,
    image: "images/products/pumpkin-bites.jpg",
    fallback: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=900&q=80&auto=format&fit=crop",
    badge: "Seasonal",
    stripePaymentLink: ""
  },
  {
    id: "kids-pops",
    category: "collection",
    name: "Kids Pops",
    detail: "Priced per pop",
    description: "Cheerful chocolate pops made with little ones in mind \u2014 just right for parties, party bags and happy surprises.",
    price: 3,
    image: "images/products/kids-pops.jpg",
    fallback: "https://images.unsplash.com/photo-1582176604856-e824b4736522?w=900&q=80&auto=format&fit=crop",
    badge: "For kids",
    stripePaymentLink: ""
  },
  {
    id: "the-gilded-star-bar",
    category: "collection",
    name: "The Gilded Star Bar",
    detail: "One-time only",
    description: "A one-time limited drop: a faceted chocolate bar finished with a white drizzle and golden flecks. Made once. When it\u2019s gone, it\u2019s gone.",
    price: 8,
    image: "images/products/gilded-star-bar.jpg",
    fallback: "",
    badge: "Limited drop",
    stripePaymentLink: ""
  }
];
