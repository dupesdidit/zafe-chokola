# Zafe Chokola — first-draft static site

Live: https://dupesdidit.github.io/zafe-chokola/ · See HANDOFF.md for the full guide.

Plain HTML/CSS/JS, no build step. Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`).

## Files
- `index.html` — page markup (hero, story, values, collections, quote band, gift boxes, reviews, newsletter, footer, cart drawer, checkout modal)
- `css/styles.css` — all styles; palette + fonts are CSS variables at the top
- `js/products.js` — **the single product catalogue** (name, price, image, category, badge, `stripePaymentLink`). Edit here to change products.
- `HANDOFF.md` — full handoff guide (start here)
- `tools/screenshot.py` — screenshots + cart smoke test
- `js/main.js` — renders products, cart (localStorage key `zafeChokola.cart.v1`), drawer, checkout placeholder, nav, newsletter demo
- `screenshots/` — desktop.png, mobile.png (full page)

## Cart / checkout
- Add-to-bag buttons, quantity +/−/typed input, remove, clear, subtotal; persists across reloads and syncs across tabs.
- Checkout shows a "Checkout coming soon — payments will connect via Stripe" modal. No payment code exists.
- To wire Stripe later: fill `stripePaymentLink` per product (Stripe Payment Links are per-product), or replace the checkout handler in `main.js` (see `// FUTURE:` comment) with a call to a server that creates a Stripe Checkout Session for the whole cart.

## Placeholders
Address, phone, email, reviews, prices and social links are all placeholders. Images are hotlinked from Unsplash (Unsplash License).
