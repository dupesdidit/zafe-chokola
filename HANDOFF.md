# Zafe Chokola Website — Handoff Guide

_Last updated: Thursday, Oct 1, 2026 (ET). Audience: AI agents and developers picking up this project._

---

## 1. Project overview

| | |
|---|---|
| **Brand** | Zafe Chokola — small-batch luxury artisan chocolatier (bonbons, bars, gift boxes) |
| **Owner** | Sherwinn |
| **Status** | First draft, live on GitHub Pages. Brand name is real; most other details (address, prices, reviews, etc.) are still placeholders — see §9. |
| **Stack** | Plain HTML + CSS + vanilla JS. **No build step, no framework, no dependencies.** |
| **Design reference** | Inspired by the *feel* of https://sanaachocolates.com/ — **not copied**. No text, images, logo, or brand assets from that site are used, and none may be added (see §11). |

### Design traits borrowed (in spirit only) from the reference
- Thin dark announcement bar on top → large dramatic hero → short brand story → row of value "badges" → customer quotes → footer with address + pickup hours + socials.
- Warm, luxe palette (gold / copper-brown / near-black / cream) and an elegant serif + clean sans pairing.
- Tone: "chocolate as art", handmade, small-batch, local pickup.

### Our own palette (CSS variables at the top of `css/styles.css`)
| Variable | Hex | Use |
|---|---|---|
| `--cocoa-900` | `#1e1410` | announcement bar, gift section, footer |
| `--cocoa-800` | `#2a1c16` | dark buttons, gift cards |
| `--cocoa-700` | `#3b2820` | spare dark tone |
| `--copper` | `#a0602f` | accents, eyebrows, italic `<em>`, quote band |
| `--gold` | `#c9a15a` | primary buttons, borders, stars |
| `--gold-light` | `#e2c588` | hover, text on dark |
| `--cream` | `#f8f1e6` | values row, newsletter, cart footer |
| `--ivory` | `#fdfaf4` | page background |
| `--ink` | `#2b2522` | body text |
| `--muted` | `#776a62` | secondary text |

### Fonts (Google Fonts, loaded in `index.html` `<head>`)
- **Cormorant Garamond** (400/500/600, italic 400) — headings, prices, wordmark (`--serif`)
- **Jost** (300/400/500) — body, nav, buttons (`--sans`)
(The reference uses Fraunces + Inter; we deliberately chose different fonts.)

### Page sections (in order, all in `index.html`)
1. **Announcement bar** — pickup / shipping note
2. **Sticky header** — "ZC" monogram + "Zafe Chokola" wordmark, nav links, **Bag** button with item count, hamburger on ≤860px
3. **Hero** (`.hero`) — "Where cacao becomes craft." + two CTAs; background image set in CSS
4. **Our Story** (`#story`) — image with gold frame + "Made by hand" stamp, two paragraphs
5. **Values** (`.values`) — 4 badges: Hand-tempered, Ethically sourced, Small batch, Natural colour
6. **Collections** (`#collections`) — product grid rendered from `js/products.js` (`category: "collection"`)
7. **Quote band** (`.band`) — copper gradient pull-quote
8. **Gift Boxes** (`#gifts`) — dark section, cards rendered from `js/products.js` (`category: "gift"`)
9. **Kind Words** (`#reviews`) — 3 testimonial cards (placeholder)
10. **Newsletter** — "The Chokola Letter" signup (**non-functional demo**)
11. **Footer** (`#visit`) — address, pickup hours, contact, socials, copyright
12. **Cart drawer**, **checkout placeholder modal**, **toast** — overlays at the end of `<body>`

Responsive breakpoints: `1024px` (4→2 product columns, 2-col footer), `860px` (mobile nav, stacked story/newsletter, 1-col gifts/reviews), `560px` (1-col products, compact header, full-width hero buttons).

---

## 2. Where things live

| What | Where |
|---|---|
| **Live site** | https://dupesdidit.github.io/zafe-chokola/ |
| **Repo** (public) | https://github.com/dupesdidit/zafe-chokola — branch `main` |
| **Canonical local working copy** | `/workspace/chocolate-site` on the shared box — a git checkout of the repo, tracking `origin/main` |
| Old publish copy | `/tmp/zc-publish` — used for the very first push; **may not persist, do not use**. Work in `/workspace/chocolate-site`. |
| Local zip (old snapshot) | `/workspace/chocolate-site.zip` — may be stale; regenerate if needed |
| Copy of this doc | `/workspace/shared/zafe-chokola/HANDOFF.md` (+ Google Doc "Zafe Chokola Website - Handoff Guide" in Sherwinn's Drive) |
| **GitHub auth** | `gh` CLI on the shared box is logged in as **`dupesdidit`** (HTTPS git protocol; scopes `repo`, `gist`, `read:org`). `git push` works through gh's credential helper. |

The box is one persistent Linux machine shared by all of the user's agents, so the working copy and gh login are available to any agent.

---

## 3. File structure

```
chocolate-site/
├── index.html          # All page markup + overlays (cart drawer, checkout modal, toast)
├── css/styles.css      # All styles. Palette/fonts as CSS variables at top; responsive rules at bottom
├── js/products.js      # THE product catalogue (single source of truth) → window.ZC_PRODUCTS
├── js/main.js          # Renders product cards, cart logic + localStorage, drawer/modal, mobile nav, newsletter demo
├── tools/screenshot.py # Playwright: screenshots + cart smoke test (local file or any URL)
├── README.md           # Short readme
├── HANDOFF.md          # This document
├── .nojekyll           # Tells GitHub Pages to serve files as-is (no Jekyll processing)
├── .gitignore          # Ignores screenshots/, *.zip, __pycache__/
└── screenshots/        # (git-ignored) hero.png, desktop.png, mobile.png
```

Script load order matters: `products.js` **must** load before `main.js` (both at the end of `<body>`).

---

## 4. How the cart works (`js/main.js`)

- **Fully client-side.** No backend, no real payments.
- **State**: an object `{ productId: quantity }` saved in `localStorage` under key **`zafeChokola.cart.v1`**.
  - Loaded on page start; unknown product IDs and quantities ≤0 are dropped; quantity capped at 99.
  - Saved on every change. Syncs across open tabs via the `storage` event.
  - If you change the cart's data shape, bump the key (e.g. `.v2`) so old saved carts don't break.
  - If you **rename a product `id`**, existing customers' saved carts silently drop that item (harmless).
- **UI**: "Add to bag" buttons (`data-add="<id>"`) → toast + count badge. Bag button opens a right-side drawer with thumbnails, −/+/typed quantity, line totals, Remove, Clear bag, subtotal. Esc / backdrop / × close it.
- **Checkout button** (disabled when empty) opens a modal: **"Checkout coming soon — online payments will connect via Stripe"** with an order summary. The hook point is marked `// FUTURE:` in the `#checkoutBtn` click handler.
- Prices are computed client-side from `products.js` — fine for display, but **never trust them for real charges** (see §10).

### `js/products.js` schema
`window.ZC_PRODUCTS` is an array of objects:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique, stable slug; used as the cart key. Don't reuse. |
| `category` | `"collection"` \| `"gift"` | `collection` → "Bonbons & bars" grid (light cards); `gift` → "Gift Boxes" (dark cards) |
| `name` | string | Card title |
| `detail` | string | Small uppercase line (e.g. "9 pieces · hand-painted shells") |
| `description` | string | 1–2 sentence blurb |
| `price` | number | USD, e.g. `32` (formatted as `$32.00`) |
| `image` | string (URL) | Currently Unsplash URLs with `?w=900&q=80&auto=format&fit=crop` |
| `badge` | string | Optional corner label ("Bestseller"); `""` for none |
| `stripePaymentLink` | string | **Empty for now.** Future Stripe Payment Link URL (`https://buy.stripe.com/...`). Not read by any code yet. |

Current products (all placeholder prices): Signature Bonbons $32, Single-Origin 72% Bar $14, Spiced Fruit & Nut Bark $18, Milk & Roasted Hazelnut $13 (collection); The Atelier Box $58, Le Grand Coffret $89, Petit Cœur $24 (gift).

---

## 5. How to edit

- **Add / edit / remove a product** → edit `js/products.js` only. Grids re-render automatically. Collections look best in multiples of 4 (desktop), gifts in multiples of 3.
- **Copy** (hero, story, values, quote, reviews, newsletter, footer, announcement bar) → `index.html`. Text is static HTML; search for the phrase.
- **Images**
  - Product images → `image` field in `products.js`.
  - Story image → `<img>` in `#story` in `index.html`.
  - Hero background → `.hero { background: … url(...) }` in `css/styles.css`.
  - For real photos: put files in a new `images/` folder and use **relative paths** (`images/bonbons.jpg`, or `../images/hero.jpg` from inside the CSS). Compress to ~200–400 KB, ~1600px wide for the hero, ~900px for cards.
- **Colours / fonts** → CSS variables at the top of `css/styles.css`; swap the Google Fonts `<link>` in `index.html` if fonts change.
- **Brand name** appears in: `<title>`, meta description, header + footer logo (`.logo-mark` "ZC", `.logo-text`), story paragraph, copyright, newsletter eyebrow ("The Chokola Letter"), README, comments in JS. `rg -n "Zafe|Chokola|ZC"` finds them all.
- **Keep all asset paths relative** (no leading `/`) — the site is served from the `/zafe-chokola/` subpath on GitHub Pages, so absolute paths will 404.

---

## 6. Preview locally

```bash
cd /workspace/chocolate-site
python3 -m http.server 8000    # then open http://localhost:8000 in the box browser
```
Opening `index.html` directly (`file://`) also works. Stop the server when done (Ctrl-C / kill it); don't leave tunnels or servers running.

## 7. Screenshots + smoke test

```bash
cd /workspace/chocolate-site
python3 tools/screenshot.py                                        # local copy
python3 tools/screenshot.py https://dupesdidit.github.io/zafe-chokola/   # live site
```
Writes `screenshots/hero.png` (1440×900 viewport), `desktop.png` (1440 wide, full page), `mobile.png` (390 wide, full page, 1x). It also adds 2 items to the bag, reloads, and prints counts/subtotal plus any console errors. Requires Python Playwright (installed on the box) and uses system Chrome at `/usr/bin/google-chrome` if present. Fixed-position elements (toast, drawer) can show up oddly in full-page shots — they are hidden with `visibility: hidden` when inactive for this reason.

---

## 8. Republish (GitHub Pages)

Pages is configured to build from **branch `main`, folder `/` (root)**, "legacy" (branch) build type. `.nojekyll` must stay in the root. Every push to `main` redeploys automatically (usually under a minute).

**⚠️ Get Sherwinn's OK before pushing anything public.**

From the canonical working copy:
```bash
cd /workspace/chocolate-site
git pull --ff-only
# ...edit...
python3 tools/screenshot.py          # review screenshots/ before publishing
git add -A && git commit -m "Describe the change"
git push
```
From a fresh machine / lost working copy:
```bash
gh repo clone dupesdidit/zafe-chokola && cd zafe-chokola
# edit, commit, push as above
```
Check the deploy:
```bash
gh api repos/dupesdidit/zafe-chokola/pages/builds/latest --jq .status   # wait for "built"
curl -s https://dupesdidit.github.io/zafe-chokola/ | grep -c "Zafe Chokola"
python3 tools/screenshot.py https://dupesdidit.github.io/zafe-chokola/
```
If committing as an agent, a working identity is: `git -c user.name=dupesdidit -c user.email=dupesdidit@users.noreply.github.com commit ...`. Never force-push `main` without explicit approval.

---

## 9. Placeholders still to replace

- [ ] **All product images**: Unsplash stock photos hotlinked from `images.unsplash.com` (Unsplash License, OK to use, but they aren't Zafe Chokola's products). Also the hero background and the story image.
- [ ] **Product names, descriptions, sizes, prices** in `products.js` (all invented)
- [ ] **Address**: "123 Placeholder Street, Your City, ST 00000"; the "Get directions" link is `#`
- [ ] **Pickup hours**: Fri 2–6 pm, Sat 10 am–2 pm (invented)
- [ ] **Contact**: `hello@example.com`, `(555) 010-0000`
- [ ] **Social links**: IG / FB / PI all point to `#`
- [ ] **Testimonials**: "Placeholder Reviewer A/B/C" with invented quotes. Replace with real, permissioned reviews only.
- [ ] **Quote band**: attributed to "Head Chocolatier (placeholder)"
- [ ] **Story copy, values, "Est. 2026"**: invented brand story; confirm with Sherwinn
- [ ] **Announcement bar**: "Complimentary local pickup every Friday · Insulated shipping on orders over $75" (invented policy)
- [ ] **Footer tagline**: "First draft — details are placeholders."
- [ ] **Newsletter**: demo only, nothing is sent
- [ ] **Checkout**: placeholder modal, no payments
- [ ] **Monogram logo**: "ZC" text in a CSS circle; replace with a real logo (SVG preferred)
- [ ] **No favicon** (the browser logs a harmless 404 for `/favicon.ico`)
- [ ] No social/OG preview tags (`og:title`, `og:image`)

---

## 10. Roadmap to going official

1. **Content**: real product list, prices, professional photos (self-hosted in `images/`), real story/about copy, address, hours, contact, socials, logo (SVG) + favicon + `apple-touch-icon` + Open Graph image/tags.
2. **Payments (Stripe)**: pick one approach:
   - **Stripe Payment Links** (no code, simplest): one link per product, stored in `stripePaymentLink`. Each link buys **one product**, so it doesn't fit a mixed cart. Options: replace "Add to bag" with "Buy now" buttons, or accept single-item checkout.
   - **Stripe Checkout for the whole cart** (recommended): needs a tiny server-side function (Netlify/Vercel/Cloudflare Function) that takes `[{id, qty}]`, looks up **server-side prices** (Stripe Price IDs, e.g. a `stripePriceId` field), creates a Checkout Session, and returns its URL. Front-end change: in the `#checkoutBtn` handler (the `// FUTURE:` comment), POST the cart and redirect. Never send prices from the browser. GitHub Pages can't run server code, so this means adding a functions host or moving hosting (see 5).
   - Add success/cancel pages (`success.html` clears the cart; `cancel.html` returns to the bag), shipping and tax settings in Stripe, plus pickup vs. shipping choice and a gift-note field (the gifts copy promises "personal note at checkout").
   - Food business compliance: allergen info, ingredients, shipping/heat policy, refund policy, privacy policy, terms.
3. **Custom domain**: add a `CNAME` file containing e.g. `www.zafechokola.com` to the repo root (or set it in repo Settings → Pages), create the DNS records at the registrar (CNAME `www` → `dupesdidit.github.io`; apex A records to GitHub Pages IPs), then enable "Enforce HTTPS". Relative paths keep working.
4. **Analytics & SEO**: privacy-friendly analytics (Plausible / GA4 / Cloudflare Web Analytics), `sitemap.xml`, `robots.txt`, meta/OG tags, LocalBusiness structured data (address, hours).
5. **Newsletter**: connect the form to Mailchimp / Klaviyo / Buttondown (embed form or API via a serverless function).
6. **Hosting options if the site outgrows Pages**:
   - **Netlify / Vercel / Cloudflare Pages**: drop-in static hosting for the same files, plus serverless functions for Stripe Checkout and forms (Netlify Forms could handle the newsletter/contact form).
   - **Shopify** (or Square Online / Squarespace Commerce): if Sherwinn wants inventory, order management, shipping labels, and taxes handled for him. That means rebuilding the design as a Shopify theme; this static site serves as the design spec.
7. **Quality**: self-host or preload fonts, optimise images (WebP/AVIF, `srcset`), accessibility pass (focus trap in drawer/modal, contrast check), Lighthouse audit.

---

## 11. Rules for anyone working on this

1. **Do not copy the reference site.** No text, photos, logo, brand name, or other assets from sanaachocolates.com. Inspiration only.
2. **Confirm with Sherwinn before publishing.** Pushing to `main` deploys publicly right away. Get explicit approval for any public change, new repos/hosting, or domain changes.
3. **Never touch payments without explicit approval.** No Stripe keys in this repo (it's public). Secret keys belong only in a serverless host's environment variables. Don't create Stripe products/links or enable real checkout without Sherwinn's go-ahead.
4. Use only properly licensed images (Sherwinn's own photos, or Unsplash/Pexels-style licences). Note the source.
5. Keep it build-free and paths relative, unless a deliberate migration is agreed.
6. Don't force-push or rewrite `main` history without approval. Don't leave local servers/tunnels running.
7. Update this HANDOFF.md whenever you change structure, data schema, hosting, or workflow.
