#!/usr/bin/env python3
"""Order-form test with a MOCKED FormSubmit endpoint (never sends a real order).

Usage: python3 tools/test_order_form.py [URL]
Writes screenshots/order-form.png (desktop, filled from the bag), order-form-mobile.png (mobile, empty bag,
quantities picked in the form), order-success.png; checks the JSON payload, cart clearing, validation and
the error fallback. Every request to formsubmit.co is intercepted; nothing leaves the machine.
"""
import asyncio, json, os, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "index.html").as_uri()
OUT = ROOT / "screenshots"; CHROME = "/usr/bin/google-chrome"
captured, errors = [], []

def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond: errors.append(msg)

async def mock(route, mode):
    req = route.request
    captured.append({"url": req.url, "method": req.method, "body": req.post_data})
    if mode["fail"]:
        await route.fulfill(status=500, content_type="application/json", body=json.dumps({"success": "false", "message": "mock failure"}))
    else:
        await route.fulfill(status=200, content_type="application/json", body=json.dumps({"success": "true", "message": "mock ok"}))

async def ctx_page(b, vp, mob, mode):
    ctx = await b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mob, has_touch=mob)
    await ctx.route("**/formsubmit.co/**", lambda r: mock(r, mode))
    pg = await ctx.new_page()
    # (the deliberately mocked 500 in the error test logs one expected "Failed to load resource" line; ignore it)
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" and "status of 500" not in m.text else None)
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    await pg.goto(URL, wait_until="networkidle")
    return ctx, pg

async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": CHROME} if os.path.exists(CHROME) else {}))
        mode = {"fail": False}

        # ---- Desktop: order from the bag ----
        ctx, pg = await ctx_page(b, {"width": 1440, "height": 1500}, False, mode)
        for pid in ["spooky-bars", "spooky-bars", "kids-pops"]:
            await pg.click(f"[data-add='{pid}']")
        await pg.click("#cartOpen"); await pg.wait_for_timeout(400)
        await pg.click("#checkoutBtn"); await pg.wait_for_timeout(400)
        check(await pg.is_visible("#orderForm"), "checkout opens order form")
        summary = await pg.inner_text("#orderItems")
        check("2 × Spooky Bars" in summary and "$16.00" in summary and "$19.00" in summary, "bag summary auto-filled (2×Spooky $16, subtotal $19)")
        # validation: empty submit sends nothing
        await pg.click("#orderSubmit"); await pg.wait_for_timeout(300)
        check(len(captured) == 0, "empty required fields block submission")
        await pg.fill("#ofName", "Alex Rivera"); await pg.fill("#ofEmail", "alex@example.com")
        await pg.fill("#ofPhone", "(555) 123-4567")
        await pg.fill("#ofAddress", "12 Example Lane\nSpringfield, ST 00000")
        await pg.check("input[name=payment][value='Cash App']")
        await pg.fill("#ofNotes", "Birthday gift for my niece, please!")
        await pg.wait_for_timeout(300)
        await pg.locator(".order-card").screenshot(path=str(OUT / "order-form.png"))
        await pg.click("#orderSubmit"); await pg.wait_for_selector("#orderSuccess:not([hidden])", timeout=5000)
        check(len(captured) == 1, "exactly one (mocked) request sent")
        r = captured[-1]; body = json.loads(r["body"] or "{}")
        check(r["url"] == "https://formsubmit.co/ajax/zafechokola@gmail.com" and r["method"] == "POST", "endpoint + POST")
        check(body.get("_subject") == "New Zafe Chokola order from Alex Rivera", "_subject")
        check(body.get("_template") == "table" and body.get("_captcha") == "false" and body.get("_replyto") == "alex@example.com" and "_honey" in body, "_template/_captcha/_replyto/_honey")
        check(body.get("delivery") == "Ship to me" and "Example Lane" in body.get("shipping_address", "") and body.get("payment") == "Cash App", "delivery/address/payment")
        check(body.get("subtotal") == "$19.00" and "2 × Spooky Bars @ $8.00 = $16.00" in body.get("order", ""), "order lines + subtotal")
        print("payload:", json.dumps(body, ensure_ascii=False, indent=1))
        check(await pg.inner_text("#cartCount") == "0", "cart cleared after success")
        check("Genelle will email you to confirm your order and payment." in await pg.inner_text("#orderSuccess"), "success message")
        await pg.locator(".order-card").screenshot(path=str(OUT / "order-success.png"))
        await ctx.close()

        # ---- Mobile: empty bag, Order now, pick quantities, market pickup ----
        ctx, pg = await ctx_page(b, {"width": 390, "height": 2000}, True, mode)
        await pg.click("#order [data-order-open]"); await pg.wait_for_timeout(400)
        check(await pg.locator("[data-pick]").count() == 3, "empty bag shows 3 quantity pickers")
        await pg.click("[data-pinc='pumpkin-bites']")
        await pg.fill("#pick-kids-pops", "4"); await pg.dispatch_event("#pick-kids-pops", "change")
        check(await pg.inner_text("#pickSubtotal") == "$32.00", "picker subtotal $32.00 (1×$20 + 4×$3)")
        await pg.check("input[name=delivery][value='Pick up at a market or event']")
        check(not await pg.is_visible("#ofAddress"), "address hidden for market pickup")
        await pg.fill("#ofName", "Sam Lee"); await pg.fill("#ofEmail", "sam@example.com")
        await pg.check("input[name=payment][value='Cash at a market']")
        await pg.wait_for_timeout(300)
        await pg.locator(".order-card").screenshot(path=str(OUT / "order-form-mobile.png"))
        mode["fail"] = True
        n = len(captured)
        await pg.click("#orderSubmit"); await pg.wait_for_selector("#formError:not([hidden])", timeout=5000)
        err = await pg.inner_html("#formError")
        check(len(captured) == n + 1 and "mailto:Zafechokola@gmail.com" in err, "error state shows mailto fallback")
        check(await pg.is_visible("#orderForm"), "form kept after error (nothing lost)")
        await ctx.close()
        await b.close()
    print("requests intercepted:", len(captured), "(all mocked; none reached formsubmit.co)")
    print("RESULT:", "ALL PASS" if not errors else "FAILURES: " + "; ".join(errors))

asyncio.run(main())
