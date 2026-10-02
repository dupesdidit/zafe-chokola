# Photo slots

Drop real photos in at **exactly these paths** (same file name, `.jpg`) and they replace the stock
placeholders automatically, with no code changes. Each slot currently holds a compressed Unsplash stock
photo (Unsplash License). If a slot file goes missing, the site falls back to the Unsplash URL
(`fallback` in `js/products.js`, `data-fallback` on the story `<img>`, the second `url()` in `.hero`).

| Slot | Used for | Recommended size | Crop |
|---|---|---|---|
| `hero.jpg` | Top hero background (left side sits under a dark overlay, so keep the subject centre/right) | 1800 × 1100 px, ≤ 300 KB | landscape |
| `story.jpg` | "Our Story" photo (no personal photo, per the owner) | 1000 × 1250 px, ≤ 250 KB | 4:5 portrait |
| `products/spooky-bars.jpg` | Spooky Bars card + bag thumbnail | 900 × 900 px, ≤ 200 KB | square |
| `products/pumpkin-bites.jpg` | Pumpkin Bites card + bag thumbnail | 900 × 900 px, ≤ 200 KB | square |
| `products/kids-pops.jpg` | Kids Pops card + bag thumbnail | 900 × 900 px, ≤ 200 KB | square |
| `logo/logo.svg` (not created yet) | Owner's logo (she will send the file). SVG preferred; else a transparent PNG ≥ 512 px | n/a | n/a |
| `logo/favicon.png` (not created yet) | Browser tab icon, made from the logo | 512 × 512 px | square |

New product? Add `images/products/<product-id>.jpg` and set `image` in `js/products.js` to that path.
Hosting note: commit the photos to the repo (relative paths, no leading `/`).
