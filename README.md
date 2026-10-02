# Zafe Chokola: static site

Live (previous version until the next approved push): https://dupesdidit.github.io/zafe-chokola/ · See HANDOFF.md for the full guide.

Plain HTML/CSS/JS, no build step. Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`).

## Files
- `index.html`: page markup (hero, story, values, shop, quote band, seasonal collections + gift-card note, ordering & care incl. allergen notice, footer/contact, cart drawer, checkout modal)
- `css/styles.css`: all styles; palette + fonts are CSS variables at the top
- `js/products.js`: **the single product catalogue** (name, price, image slot + fallback, category, badge, `stripePaymentLink`). Edit here to change products.
- `js/main.js`: renders products, image fallback, cart (localStorage key `zafeChokola.cart.v1`), drawer, checkout placeholder, nav
- `images/`: photo slots (see `images/README.md`); currently stock placeholders
- `HANDOFF.md`: full handoff guide (start here)
- `tools/screenshot.py`: screenshots + cart smoke test

## Cart / checkout
- Add-to-bag buttons, quantity +/−/typed input, remove, clear, subtotal; persists across reloads and syncs across tabs.
- Checkout shows a "Checkout coming soon" (Stripe) modal. No payment code exists.

## Placeholders
Hero, story and seasonal photos are the founder's own (graded, see images/README.md); product photos are still Unsplash stock; logo is a "ZC" text monogram; Cash App cashtag still to come. See HANDOFF.md §9.
