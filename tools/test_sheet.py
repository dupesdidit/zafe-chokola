#!/usr/bin/env python3
"""Test the Google Sheet product catalogue (js/main.js loadSheet) in headless Chrome.

Scenarios (each in a fresh browser context):
  live     - the real sheet from js/products.js (ZC_SHEET.id), straight from Google
  mocked   - the gviz CSV is answered locally with sheet-shaped data (quoted commas, "$8.00" prices,
             a hidden row, custom sort order, a Stripe link, a Drive photo link) to prove parsing/rendering
  badid    - ?sheet=BADID  -> Google refuses -> built-in list (fallback)
  timeout  - the gviz request hangs -> built-in list after ZC_SHEET.timeoutMs (3 s)
Screenshots: screenshots/sheet-<scenario>.png (shop section, 1440 wide) + sheet-mocked-mobile.png
Usage: python3 tools/test_sheet.py
"""
import asyncio, functools, http.server, os, pathlib, socketserver, threading, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "screenshots"; CHROME = "/usr/bin/google-chrome"

MOCK_CSV = '''"Show","Name","Price","Price note","Category","Description","Photo","Stripe payment link","Sort order"
"TRUE","The Gilded Star Bar","$8.00","","Limited drop","A one-time limited drop: a faceted chocolate bar, finished with a white drizzle and golden flecks. Made once. When it's gone, it's gone.","https://drive.google.com/file/d/17ZVY1wAdnomAVp4NIkaKBbFbWU90ebjI/view?usp=sharing","","1"
"TRUE","Spooky Bars","$8.00","","Halloween","Playful, spooky-season chocolate bars, ""frightfully"" fun.","https://zafechokola.com/images/products/spooky-bars.jpg","https://buy.stripe.com/test_example","2"
"FALSE","Pumpkin Bites","$20.00","","Seasonal","Hidden row - must not appear.","","","3"
"TRUE","Kids Pops","$3.00","each","For kids","Cheerful chocolate pops, made with little ones in mind.","https://zafechokola.com/images/products/kids-pops.jpg","","4"
"TRUE","Test Truffles","$12.50","box of 6","Test","Sheet-only product (no fallback entry).","","","5"
'''

def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"

async def run(b, base, name, query="", mock=None, mobile=False):
    vp = {"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900}
    ctx = await b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    pg = await ctx.new_page(); logs = []
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    if mock == "csv":
        await pg.route("**/gviz/tq**", lambda r: r.fulfill(status=200, content_type="text/csv", body=MOCK_CSV,
                       headers={"Access-Control-Allow-Origin": "*"}))
    elif mock == "hang":
        async def hang(r):
            await asyncio.sleep(6)
            try: await r.abort()
            except Exception: pass
        await pg.route("**/gviz/tq**", hang)
    t0 = time.time()
    await pg.goto(base + "index.html" + query, wait_until="domcontentloaded")
    first = await pg.evaluate("document.querySelectorAll('#collectionGrid .product-card').length")
    try:
        await pg.wait_for_function("document.documentElement.dataset.catalogue==='sheet'", timeout=4500)
    except Exception: pass
    await pg.wait_for_timeout(3300 if mock == "hang" else 1200)
    state = await pg.evaluate("document.documentElement.dataset.catalogue")
    names = await pg.eval_on_selector_all("#collectionGrid h3", "e=>e.map(x=>x.textContent)")
    buys = await pg.eval_on_selector_all("#collectionGrid a.btn", "e=>e.map(x=>x.href)")
    await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
    await pg.wait_for_timeout(2500)
    imgs = await pg.eval_on_selector_all("#collectionGrid img", "e=>e.map(x=>[x.alt, x.naturalWidth>0, x.currentSrc.slice(0,70)])")
    print(f"[{name}] first paint cards={first} -> catalogue={state} ({time.time()-t0:.1f}s)")
    print(f"   cards: {names}")
    print(f"   buy links: {buys or 'none'}")
    for i in imgs: print("   img", i)
    # cart: add the last visible card, reload, make sure it survives (sheet-only ids too)
    ids = await pg.eval_on_selector_all("#collectionGrid [data-add]", "e=>e.map(x=>x.dataset.add)")
    if ids:
        await pg.click(f"[data-add='{ids[-1]}']"); await pg.click(f"[data-add='{ids[0]}']")
        sub = await pg.text_content("#cartSubtotal")
        await pg.reload(wait_until="domcontentloaded"); await pg.wait_for_timeout(1500 if mock != "hang" else 3500)
        print(f"   cart add {ids[0]} + {ids[-1]}: subtotal {sub}; after reload count={await pg.text_content('#cartCount')} subtotal={await pg.text_content('#cartSubtotal')}")
    for l in logs:
        if not l.startswith("verbose"): print("   console", l[:160])
    await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
    await pg.wait_for_timeout(1500)
    el = await pg.query_selector("#shop")
    await el.screenshot(path=str(OUT / f"sheet-{name}.png"))
    await ctx.close()

async def main():
    OUT.mkdir(exist_ok=True); srv, base = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": CHROME} if os.path.exists(CHROME) else {}))
        await run(b, base, "live")
        await run(b, base, "mocked", mock="csv")
        await run(b, base, "mocked-mobile", mock="csv", mobile=True)
        await run(b, base, "badid", query="?sheet=BADID_doesnotexist")
        await run(b, base, "timeout", mock="hang")
        await b.close()
    srv.shutdown()

asyncio.run(main())
