# Zafe Chokola Website — Handoff Guide

_Last updated: Friday, Oct 2, 2026, ~4:55 AM ET (founder's photos graded and added; committed locally, not pushed). Audience: AI agents and developers picking up this project._

---

## 1. Project overview

| | |
|---|---|
| **Brand** | Zafe Chokola: playful chocolate treats with Caribbean (St. Lucian) roots; "chocolate made to evoke a joyful memory" |
| **Owner** | Sherwinn (site owner/approver). Content comes from the founder's questionnaire (`/workspace/shared/zafe-chokola/genelle-answers.md`, submitted 10/1/26 10:45 PM ET). On the site she is credited only as **"Founder & Chocolatier"**: no personal name, no personal photo (her request). |
| **Status** | Customised from the founder's questionnaire (Oct 1, 2026; that commit `6f7e2bc` is on `origin/main`). Oct 2, 2026: the founder's own photos (graded) are now in the hero, story and seasonal tiles. Those commits are **local only, NOT pushed** until Sherwinn approves. Product cards still use stock; see §9. |
| **Domain** | Founder owns **Thechocolateaffair.net**. **Not connected yet** (no `CNAME` file, no DNS changes). Connecting it needs approval; see §10.3. |
| **Stack** | Plain HTML + CSS + vanilla JS. **No build step, no framework, no dependencies.** |
| **Design reference** | Inspired by the *feel* of https://sanaachocolates.com/ — **not copied**. No text, images, logo, or brand assets from that site are used, and none may be added (see §11). |

### Design traits borrowed (in spirit only) from the reference
- Thin dark announcement bar on top → large hero → short brand story → row of value "badges" → footer.
- Warm palette (gold / copper-brown / near-black / cream). The founder loves the colours "as they are", so they were kept.
- Tone (founder's picks): **playful + modern**, lettering "bold and playful". Rounded display headings, pill buttons, larger radii, slight tilts on badges/tiles; still readable.

### Our own palette (CSS variables at the top of `css/styles.css`)
| Variable | Hex | Use |
|---|---|---|
| `--cocoa-900` | `#1e1410` | announcement bar, seasonal section, footer |
| `--cocoa-800` | `#2a1c16` | dark buttons, logo mark, season tiles, icon circles |
| `--cocoa-700` | `#3b2820` | spare dark tone |
| `--copper` | `#a0602f` | accents, eyebrows, `<em>` highlight, quote band |
| `--gold` | `#c9a15a` | primary buttons, borders, badges |
| `--gold-light` | `#e2c588` | hover, text on dark |
| `--cream` | `#f8f1e6` | values row, allergen card, cart footer |
| `--ivory` | `#fdfaf4` | page background |
| `--ink` | `#2b2522` | body text |
| `--muted` | `#776a62` | secondary text |

### Fonts (Google Fonts, loaded in `index.html` `<head>`)
- **Fredoka** (500/600/700): bold, rounded, playful display font for headings, prices, buttons, nav, wordmark (`--display`; `--serif` is kept as an alias pointing to it)
- **Jost** (400/500): body text (`--sans`)
(Changed Oct 1, 2026 from Cormorant Garamond per the founder's "bold and playful" pick. Fredoka has no italics, so `<em>` is upright copper with a gold highlighter stripe in `h2`.)

### Page sections (in order, all in `index.html`)
1. **Announcement bar**: "Now shipping with cold packs · Catch us at farmers' markets & events"
2. **Sticky header**: "ZC" monogram (logo slot) + "Zafe Chokola" wordmark, nav (Our Story, Shop, Seasonal, Ordering & Care, Contact), **Bag** button with item count, hamburger on ≤860px
3. **Hero** (`.hero`): "Chocolate made for joyful memories." + two CTAs; background photo slot `images/hero.jpg` (founder's Valentine's heart) set in CSS
4. **Our Story** (`#story`): photo slot `images/story.jpg` (founder's Easter eggs) with dashed gold frame + "Made with joy" stamp, founder's story, signed "Founder & Chocolatier"
5. **Values** (`.values`): Made with joy · Milk chocolate (signature) · Seasonal fun · Cold-packed
6. **Shop** (`#shop`, grid `#collectionGrid`): product cards rendered from `js/products.js` (`category: "collection"`), 3 columns on desktop
7. **Quote band** (`.band`): founder's mission line
8. **Seasonal Collections** (`#seasonal`, dark): Valentine's, Easter, Halloween tiles with the founder's photos (`images/seasonal/*.jpg`, `.season.has-photo`); Birthdays tile is icon-only (no photo yet); no products/prices yet + "Gift cards: coming soon" note
9. **Ordering & Care** (`#ordering`): Shipping, Markets & events, Paying (cards coming soon + Cash App), Freshness & storage, Damaged or melted, **Allergen notice** (`#allergens`)
10. **Footer** (`#contact`): tagline, Find Us (shipping / markets & events), Say Hello (email + Instagram), Coming Soon (gift cards, online checkout)
11. *(Removed Oct 1, 2026: Gift Boxes, Kind Words/testimonials, Newsletter, address, pickup hours, phone, FB/Pinterest. See §9.)*
12. **Cart drawer**, **checkout placeholder modal**, **toast** — overlays at the end of `<body>`

Responsive breakpoints: `1024px` (3→2 product columns, 2-col info/season grids and footer), `860px` (mobile nav, stacked story), `560px` (1-col products/info/footer, compact header, full-width hero buttons).

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
├── js/main.js          # Renders product cards, image fallback, cart logic + localStorage, drawer/modal, mobile nav
├── images/             # Photo slots: hero.jpg, story.jpg, seasonal/*.jpg (founder photos, graded); products/*.jpg (stock); logo/ (empty); stock-backup/ (original stock). See images/README.md
├── tools/grade_photos.py # Colour-grades founder photos into the slots + writes before/after comparisons
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
| `category` | `"collection"` \| `"gift"` | `collection` → Shop grid. `gift` is still supported in `main.js` but the Gift Boxes section was removed (none offered); re-add a `#giftGrid` element if gift boxes return. |
| `name` | string | Card title |
| `detail` | string | Small uppercase line (e.g. "9 pieces · hand-painted shells") |
| `description` | string | 1–2 sentence blurb |
| `price` | number | USD, e.g. `32` (formatted as `$32.00`) |
| `image` | string (relative path) | Local photo slot, e.g. `images/products/spooky-bars.jpg` (all 3 product slots still hold stock photos) |
| `fallback` | string (URL) | Optional. Stock (Unsplash) URL used automatically if the local `image` file is missing (handled in `main.js` via `data-fallback`) |
| `badge` | string | Optional corner label ("Bestseller"); `""` for none |
| `stripePaymentLink` | string | **Empty for now.** Future Stripe Payment Link URL (`https://buy.stripe.com/...`). Not read by any code yet. |

Current products (real, from the founder's questionnaire): **Spooky Bars $8.00**, **Pumpkin Bites $20.00**, **Kids Pops $3.00 each** (all `collection`). Sizes/piece counts, ingredients and per-product photos are not provided yet, so descriptions make no ingredient claims. Signature flavour: milk chocolate.

---

## 5. How to edit

- **Add / edit / remove a product** → edit `js/products.js` only. The grid re-renders automatically and looks best in multiples of 3 on desktop.
- **Copy** (hero, story, values, quote, seasonal, ordering & care, footer, announcement bar) → `index.html`. Text is static HTML; search for the phrase.
- **Images / photo slots** (full table with sizes in `images/README.md`). To use a real photo, **overwrite the slot file at the same path**; no code change needed:
  | Slot | Where it shows | Recommended size |
  |---|---|---|
  | `images/hero.jpg` | hero background (`.hero` in `css/styles.css`, fallback Unsplash URL is the 2nd `url()`) | 1800×1100, ≤300 KB, subject centre/right |
  | `images/story.jpg` | Our Story `<img>` (`data-fallback` attribute) | 1000×1250 (4:5), ≤250 KB |
  | `images/seasonal/valentines.jpg`, `easter.jpg`, `halloween.jpg` (`birthdays.jpg` empty) | Seasonal tiles (`.season.has-photo`); no fallback | 800×600 (4:3) |
  | `images/products/spooky-bars.jpg` | Spooky Bars card + bag thumbnail | 900×900 square, ≤200 KB |
  | `images/products/pumpkin-bites.jpg` | Pumpkin Bites card + bag thumbnail | 900×900 square, ≤200 KB |
  | `images/products/kids-pops.jpg` | Kids Pops card + bag thumbnail | 900×900 square, ≤200 KB |
  | `images/logo/logo.svg` (**empty slot**) | header + footer logo; currently the "ZC" text monogram (`.logo-mark`, see `<!-- LOGO SLOT -->` in `index.html`) | SVG preferred, else transparent PNG ≥512 px |
  | `images/logo/favicon.png` (**empty slot**) | browser tab icon; currently an inline "ZC" SVG data-URI `<link rel="icon">` | 512×512 |
  - **Oct 2, 2026:** hero, story and the Valentine's/Easter/Halloween tiles use the **founder's own photos**, colour-graded by `tools/grade_photos.py` to match the original moody stock look. Ungraded originals: `/workspace/shared/zafe-chokola/genelle-uploads/originals/` (downloaded from her Google Drive folder `1N4uGY6eqagYkc7AL1KAqKV6tumnwbhel`, not in the repo). Before/after comparisons + contact sheet are in `/workspace/shared/zafe-chokola/genelle-uploads/`.
  - The 3 **product** slots still hold Unsplash stock: none of her uploads clearly shows Spooky Bars, Pumpkin Bites or Kids Pops.
  - **Stock backup:** the original stock hero/story/product images are committed in `images/stock-backup/`. Switch back with e.g. `cp images/stock-backup/hero.jpg images/hero.jpg` (details in `images/README.md`). Don't delete it.
  - New/replacement founder photo: put the original in the originals folder, set the slot in `SLOTS` in `tools/grade_photos.py`, run `python3 tools/grade_photos.py`, then check the comparisons.
  - Fallback: if a slot file is missing, `main.js` swaps product/story images to the `fallback`/`data-fallback` Unsplash URL; the hero CSS shows the Unsplash layer underneath.
  - When the logo arrives: replace `<span class="logo-mark">ZC</span>` (header + footer) with `<img src="images/logo/logo.svg" alt="Zafe Chokola" class="logo-img">`, add a height rule, and point the favicon `<link>` at `images/logo/favicon.png`.
- **Colours / fonts** → CSS variables at the top of `css/styles.css`; swap the Google Fonts `<link>` in `index.html` if fonts change.
- **Brand name** appears in: `<title>`, meta description, favicon, header + footer logo (`.logo-mark` "ZC", `.logo-text`), story paragraph, copyright, README, comments in JS. `rg -n "Zafe|Chokola|ZC"` finds them all.
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
Writes `screenshots/hero.png` (1440×900 viewport), `desktop.png` (1440 wide, full page), `mobile.png` (390 wide, full page, 1x). It also adds the first 2 products to the bag (currently Spooky Bars + Pumpkin Bites → expect count 2, subtotal $28.00), reloads, and prints counts/subtotal plus any console errors. Requires Python Playwright (installed on the box) and uses system Chrome at `/usr/bin/google-chrome` if present. Fixed-position elements (toast, drawer) can show up oddly in full-page shots — they are hidden with `visibility: hidden` when inactive for this reason.

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

_Updated Oct 1, 2026 after applying the founder's questionnaire._

**Done (real content now):** story + name meaning, mission line (quote band), "Founder & Chocolatier" credit, products + prices, allergen notice, shipping/markets ordering info, payment methods, contact email, Instagram, damaged/melted refund policy, freshness (up to 6 months), seasonal collections, gift-cards-coming-soon note, playful heading font. **Removed:** street address + "Get directions", pickup hours, phone, Facebook/Pinterest, testimonials, press, newsletter, gift boxes, custom-order promise, "Est. 2026", invented values (ethically sourced, natural colour, etc.).

Still open:
- [x] **Photos (partly done, Oct 2)**: hero, story, Valentine's/Easter/Halloween tiles now use the founder's graded photos.
- [ ] **Product photos**: Spooky Bars, Pumpkin Bites and Kids Pops still use stock. Her uploads show Easter eggs, an Easter bunny, a Valentine's heart set, skull bonbons and football-helmet chocolates, none clearly matching these products. Ask her for photos of each (or confirm whether the skull box *is* the Spooky Bars).
- [ ] **Birthdays tile photo** (`images/seasonal/birthdays.jpg`): none yet.
- [ ] **Unused upload**: `4ED1F9B3-….jpg` (chocolate football helmets, held in a gloved hand) has no slot yet; ask what it is / where she'd like it.
- [ ] **Logo**: founder said she'll send her logo file. Still not received: `IMG_6470.PNG` in her Drive upload is a photo of skull chocolates (actually a JPEG), **not a logo**. "ZC" text monogram + inline SVG favicon until then.
- [ ] **Cash App $cashtag**: Cash App is listed as accepted, but no cashtag was given. Marked `<!-- TODO(owner) -->` in the "Paying" card in `index.html`. Don't guess it.
- [ ] **Product details**: sizes/piece counts, what's inside and ingredients aren't provided; descriptions stay generic. Confirm whether Spooky Bars ($8) and Pumpkin Bites ($20) are per bar/box and their sizes. Kids Pops are "$3.00 a piece" (shown as "Priced per pop").
- [ ] **Seasonal collections**: tiles only (Valentine's, Easter, Halloween, Birthdays); no products, timing or prices yet.
- [ ] **Gift cards**: "coming soon" note only; no mechanism.
- [ ] **Shipping details**: where she ships to, rates, which months shipping pauses, order lead time/minimums: not provided. Copy says only "pauses during the hottest months".
- [ ] **Markets/events schedule**: none given; copy points to Instagram.
- [ ] **Location/heritage-inspired flavours**: no answer to "Where are you based?"; site mentions only her St. Lucian roots, no business location.
- [ ] **Checkout**: placeholder modal, no payments ("coming soon via Stripe").
- [ ] **Policies not yet given**: cancellations/changes, holiday cut-offs, privacy policy, terms. Refund policy covers damaged/melted orders only.
- [ ] **Newsletter**: removed (founder: "not right now"). Later she'd like to send seasonal launches + discounts/offers.
- [ ] **Custom/corporate orders**: not offered "at this time" (she noted 3 weeks' notice for the future). No mention on the site.
- [ ] **Domain**: `Thechocolateaffair.net` (owned by the founder, **not connected**). Note it differs from the brand name; confirm she wants it as the site address.
- [ ] No social/OG preview tags (`og:title`, `og:image`)

---

## 10. Roadmap to going official

1. **Content**: product photos into the `images/products/` slots, logo (SVG) + favicon + `apple-touch-icon` + Open Graph image/tags, product sizes, Cash App cashtag (see §9).
2. **Payments (Stripe)**: pick one approach:
   - **Stripe Payment Links** (no code, simplest): one link per product, stored in `stripePaymentLink`. Each link buys **one product**, so it doesn't fit a mixed cart. Options: replace "Add to bag" with "Buy now" buttons, or accept single-item checkout.
   - **Stripe Checkout for the whole cart** (recommended): needs a tiny server-side function (Netlify/Vercel/Cloudflare Function) that takes `[{id, qty}]`, looks up **server-side prices** (Stripe Price IDs, e.g. a `stripePriceId` field), creates a Checkout Session, and returns its URL. Front-end change: in the `#checkoutBtn` handler (the `// FUTURE:` comment), POST the cart and redirect. Never send prices from the browser. GitHub Pages can't run server code, so this means adding a functions host or moving hosting (see 6).
   - Add success/cancel pages (`success.html` clears the cart; `cancel.html` returns to the bag), shipping and tax settings in Stripe (shipping only, no pickup; account for the summer shipping pause).
   - Food business compliance: allergen info, ingredients, shipping/heat policy, refund policy, privacy policy, terms.
3. **Custom domain**: the founder owns **`Thechocolateaffair.net`** (not connected yet; needs approval). Add a `CNAME` file containing e.g. `www.thechocolateaffair.net` to the repo root (or set it in repo Settings → Pages), create the DNS records at the registrar (CNAME `www` → `dupesdidit.github.io`; apex A records to GitHub Pages IPs), then enable "Enforce HTTPS". Relative paths keep working.
4. **Analytics & SEO**: privacy-friendly analytics (Plausible / GA4 / Cloudflare Web Analytics), `sitemap.xml`, `robots.txt`, meta/OG tags, Organization structured data (no street address; she prefers not to show one).
5. **Newsletter** (later; founder said not right now): when wanted, re-add a signup connected to Mailchimp / Klaviyo / Buttondown for seasonal launches and offers.
6. **Hosting options if the site outgrows Pages**:
   - **Netlify / Vercel / Cloudflare Pages**: drop-in static hosting for the same files, plus serverless functions for Stripe Checkout and forms (Netlify Forms could handle the newsletter/contact form).
   - **Shopify** (or Square Online / Squarespace Commerce): if Sherwinn wants inventory, order management, shipping labels, and taxes handled for him. That means rebuilding the design as a Shopify theme; this static site serves as the design spec.
7. **Quality**: self-host or preload fonts, optimise images (WebP/AVIF, `srcset`), accessibility pass (focus trap in drawer/modal, contrast check), Lighthouse audit.

---

## 11. Rules for anyone working on this

1. **Do not copy the reference site.** No text, photos, logo, brand name, or other assets from sanaachocolates.com. Inspiration only.
2. **Confirm with Sherwinn before publishing.** Pushing to `main` deploys publicly right away. Get explicit approval for any public change, new repos/hosting, or domain changes.
3. **Never touch payments without explicit approval.** No Stripe keys in this repo (it's public). Secret keys belong only in a serverless host's environment variables. Don't create Stripe products/links or enable real checkout without Sherwinn's go-ahead.
4. Use only properly licensed images (the founder's own photos, or Unsplash/Pexels-style licences). Note the source. No personal photo of the founder (her request).
5. Keep it build-free and paths relative, unless a deliberate migration is agreed.
6. Don't force-push or rewrite `main` history without approval. Don't leave local servers/tunnels running.
7. Update this HANDOFF.md whenever you change structure, data schema, hosting, or workflow.
8. Don't invent facts (ingredients, sourcing, locations, reviews, press, cashtags). Use only what the founder has provided.
