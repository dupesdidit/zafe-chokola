# Photo slots

Drop a photo in at **exactly one of these paths** (same file name, `.jpg`) and the site picks it up
with no code changes. _Updated Oct 2, 2026: the founder's own photos are now in use (see table)._

| Slot | Used for | Current image | Recommended size | Crop |
|---|---|---|---|---|
| `hero.jpg` | Hero background (left side sits under a dark overlay, so keep the subject centre/right) | **Founder photo**: red speckled chocolate heart + heart box (Valentine's), graded | 1800 × 1100 px, ≤ 300 KB | landscape |
| `story.jpg` | "Our Story" photo (no personal photo, per the owner) | **Founder photo**: gold-lustre and speckled Easter eggs, graded | 1000 × 1250 px, ≤ 250 KB | 4:5 portrait |
| `seasonal/valentines.jpg` | Valentine's tile in Seasonal Collections | **Founder photo**: chocolate heart box with lips/roses/hearts, graded | 800 × 600 px, ≤ 120 KB | 4:3 |
| `seasonal/easter.jpg` | Easter tile | **Founder photo**: chocolate Easter bunny, graded | 800 × 600 px | 4:3 |
| `seasonal/halloween.jpg` | Halloween tile | **Founder photo**: box of skull chocolates, graded | 800 × 600 px | 4:3 |
| `seasonal/birthdays.jpg` | Birthdays tile (**empty**; the tile shows an icon only. Add the file plus the `has-photo` markup, see comment in `index.html`) | none | 800 × 600 px | 4:3 |
| `products/spooky-bars.jpg` | Spooky Bars card + bag thumbnail | Unsplash stock (no matching founder photo yet) | 900 × 900 px, ≤ 200 KB | square |
| `products/pumpkin-bites.jpg` | Pumpkin Bites card + bag thumbnail | Unsplash stock (no matching founder photo yet) | 900 × 900 px, ≤ 200 KB | square |
| `products/kids-pops.jpg` | Kids Pops card + bag thumbnail | Unsplash stock (no matching founder photo yet) | 900 × 900 px, ≤ 200 KB | square |
| `logo/logo.svg` (**empty**) | Owner's logo (not received yet; "ZC" text monogram in use). SVG preferred; else transparent PNG ≥ 512 px | none | n/a | n/a |
| `logo/favicon.png` (**empty**) | Browser tab icon, made from the logo | none | 512 × 512 px | square |

Fallbacks: if a product or story file goes missing, the site falls back to an Unsplash URL
(`fallback` in `js/products.js`, `data-fallback` on the story `<img>`, the second `url()` in `.hero`).
Seasonal tiles have no fallback, so keep those files in place.

## Colour grade (founder photos)

The founder's photos are graded to match the original moody stock look (warm balance, rich contrast,
slightly lifted blacks, rolled-off highlights, cocoa/ivory split-tone, deeper browns, soft vignette) by
`tools/grade_photos.py`. Ungraded originals live **outside the repo** at
`/workspace/shared/zafe-chokola/genelle-uploads/originals/` (from her Google Drive folder). Re-run after
adding or replacing a photo:

```bash
python3 tools/grade_photos.py      # edit SLOTS in the script to change source/crop/vignette per slot
```
It also writes before/after `compare-*.jpg` + `contact-sheet.jpg` to `/workspace/shared/zafe-chokola/genelle-uploads/`.

## Stock backup and switching back

The original Unsplash stock placeholders are preserved in **`images/stock-backup/`** (`hero.jpg`,
`story.jpg`, `products/*.jpg`; committed Oct 2, 2026). To switch any slot back to stock, copy the
backup over the slot, e.g.:

```bash
cp images/stock-backup/hero.jpg  images/hero.jpg
cp images/stock-backup/story.jpg images/story.jpg
```
(or `git checkout 559e711 -- images/hero.jpg`). To drop the seasonal photos, remove `has-photo` and the
`<img>` from each tile in `index.html`. Never delete the backup folder.

New product? Add `images/products/<product-id>.jpg` and set `image` in `js/products.js` to that path.
Commit photos to the repo (relative paths, no leading `/`).
