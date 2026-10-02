#!/usr/bin/env python3
"""Render screenshots of the Zafe Chokola site and smoke-test the cart.

Usage:
  python3 tools/screenshot.py                      # local file (index.html next to this repo)
  python3 tools/screenshot.py https://dupesdidit.github.io/zafe-chokola/
Outputs: screenshots/hero.png (1440x900 viewport), desktop.png (1440 full page),
         mobile.png (390 full page, 1x). Prints cart test results + console errors.
Requires: pip install playwright && (playwright install chromium  OR  system Chrome at /usr/bin/google-chrome)
"""
import asyncio, os, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "index.html").as_uri()
OUT = ROOT / "screenshots"
CHROME = "/usr/bin/google-chrome"

async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        kw = {"executable_path": CHROME} if os.path.exists(CHROME) else {}
        b = await p.chromium.launch(**kw)
        errs = []
        for name, vp, mob in [("desktop", {"width": 1440, "height": 900}, False),
                              ("mobile", {"width": 390, "height": 844}, True)]:
            ctx = await b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mob, has_touch=mob)
            pg = await ctx.new_page()
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(URL, wait_until="networkidle")
            await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
            await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(1500)
            if name == "desktop":
                await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
                await pg.screenshot(path=str(OUT / "hero.png"))
            await pg.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
            # Cart smoke test (uses a fresh context, so localStorage starts empty)
            ids = await pg.evaluate("window.ZC_PRODUCTS.slice(0,2).map(p=>p.id)")
            for pid in ids:
                await pg.click(f"[data-add='{pid}']")
            await pg.click("#cartOpen"); await pg.wait_for_timeout(500)
            print(name, "cart count", await pg.inner_text("#cartCount"), "subtotal", await pg.inner_text("#cartSubtotal"))
            await pg.reload(wait_until="networkidle")
            print(name, "after reload count", await pg.inner_text("#cartCount"))
            await ctx.close()
        print("console errors:", errs or "none")
        await b.close()

asyncio.run(main())
