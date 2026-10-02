#!/usr/bin/env python3
"""Custom-order form test with FormSubmit MOCKED (never sends a real request).

Usage: python3 tools/test_custom_order.py
Serves the site on a temporary local port (FormSubmit needs http(s) for _next), intercepts every request to
formsubmit.co, checks the multipart/form-data body (fields, FormSubmit controls, file attachments), validation
(required fields, 3-week date rule, 5 MB file limit, conditional address/shape fields) and the cart's separate
"coming soon" checkout. Screenshots: screenshots/custom-order.png (desktop, filled), custom-order-mobile.png,
custom-order-success.png (thanks.html after the mocked redirect).
"""
import asyncio, datetime, functools, http.server, os, pathlib, socketserver, threading, re
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "screenshots"; CHROME = "/usr/bin/google-chrome"; TMP = pathlib.Path("/tmp/zc-co-test")
captured, errors, echoed = [], [], []

def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond: errors.append(msg)

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def do_POST(self):  # local echo endpoint (/__echo) used to prove file bytes really leave the browser
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            echoed.append(data)
            m = re.search(rb'name="_next"\r\n\r\n([^\r]+)', data)
            self.send_response(303); self.send_header("Location", m.group(1).decode() if m else "/"); self.end_headers()
    h = functools.partial(Quiet, directory=str(ROOT))
    srv = socketserver.TCPServer(("127.0.0.1", 0), h); threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def fixtures():
    TMP.mkdir(exist_ok=True)
    from PIL import Image
    Image.new("RGB", (64, 64), (160, 96, 47)).save(TMP / "logo.png")
    (TMP / "brief.pdf").write_bytes(b"%PDF-1.4\n% test reference\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")
    (TMP / "huge.png").write_bytes(b"\x89PNG\r\n\x1a\n" + os.urandom(6 * 1024 * 1024))

async def mock(route):
    req = route.request
    buf = req.post_data_buffer or b""
    captured.append({"url": req.url, "method": req.method, "ctype": req.headers.get("content-type", ""), "body": buf})
    m = re.search(rb'name="_next"\r\n\r\n([^\r]+)', buf)
    nxt = m.group(1).decode() if m else "about:blank"
    await route.fulfill(status=303, headers={"Location": nxt}, body="")

def part(body, name):
    m = re.search(rb'name="' + re.escape(name.encode()) + rb'"\r\n\r\n(.*?)\r\n--', body, re.S)
    return m.group(1).decode("utf8", "replace") if m else None

async def page(b, base, vp, mob):
    ctx = await b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mob, has_touch=mob)
    await ctx.route("**/formsubmit.co/**", mock)
    pg = await ctx.new_page()
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    await pg.goto(base + "index.html#custom-order", wait_until="networkidle")
    return ctx, pg

async def main():
    OUT.mkdir(exist_ok=True); fixtures(); srv = serve(); base = f"http://127.0.0.1:{srv.server_address[1]}/"
    soon = (datetime.date.today() + datetime.timedelta(days=7)).isoformat()
    ok = (datetime.date.today() + datetime.timedelta(days=35)).isoformat()
    async with async_playwright() as p:
        b = await p.chromium.launch(**({"executable_path": CHROME} if os.path.exists(CHROME) else {}))

        # ---- Desktop ----
        ctx, pg = await page(b, base, {"width": 1440, "height": 2600}, False)
        # bag is independent: checkout shows "coming soon"
        await pg.click("[data-add='spooky-bars']"); await pg.click("#cartOpen"); await pg.wait_for_timeout(400)
        await pg.click("#checkoutBtn"); await pg.wait_for_timeout(300)
        check("Checkout coming soon" in await pg.inner_text("#checkoutModal"), "bag checkout shows 'coming soon' (not tied to form)")
        await pg.click("#modalOk"); await pg.wait_for_timeout(400)
        check(await pg.locator("#customForm [data-pick], #customForm .modal-summary").count() == 0, "form has no product pickers / cart summary")
        await pg.click("a[href='#custom-order'].btn")  # teaser band button
        await pg.click("#coSubmit"); await pg.wait_for_timeout(300)
        check(len(captured) == 0 and await pg.is_visible("#coError"), "empty submit blocked with message")
        await pg.fill("#coName", "Jordan Blake"); await pg.fill("#coEmail", "jordan@example.com"); await pg.fill("#coPhone", "(555) 222-0199")
        await pg.select_option("#coOccasion", "Birthday"); await pg.select_option("#coType", "Milk")
        await pg.select_option("#coShape", "Custom shape")
        check(await pg.is_visible("#coShapeDesc"), "custom shape reveals description field")
        await pg.fill("#coShapeDesc", "The number 30, about the size of a phone")
        await pg.fill("#coSize", "About 6 in / 15 cm tall"); await pg.fill("#coQty", "2")
        await pg.fill("#coColours", "Gold and ivory"); await pg.fill("#coText", "Happy 30th, Maya!")
        await pg.fill("#coDesc", "A milk chocolate number 30 with gold lustre for my sister's birthday, plus a few small hearts to match.")
        await pg.fill("#coDate", soon); await pg.dispatch_event("#coDate", "change")
        check(await pg.is_visible("#dateMsg") and "3 weeks" in await pg.inner_text("#dateMsg"), "date < 21 days shows friendly 3-week message")
        await pg.click("#coSubmit"); await pg.wait_for_timeout(300)
        check(len(captured) == 0, "too-soon date blocks submission")
        await pg.click("#coSubmit")  # (re-run validation after the date fix below clears the banner)
        await pg.fill("#coDate", ok); await pg.dispatch_event("#coDate", "change")
        check(not await pg.is_visible("#dateMsg"), "date >= 21 days accepted")
        await pg.set_input_files("#coFile1", str(TMP / "huge.png"))
        check(await pg.is_visible("#fileMsg") and "5 MB" in await pg.inner_text("#fileMsg"), "files over 5 MB rejected with message")
        await pg.set_input_files("#coFile1", str(TMP / "logo.png"))
        check(not await pg.is_visible("#fileMsg") and await pg.is_visible("#addFile"), "valid file accepted; 'add another' offered")
        await pg.click("#addFile"); await pg.set_input_files("#coFile2", str(TMP / "brief.pdf"))
        await pg.select_option("#coBudget", "$50–100")
        await pg.fill("#coAddress", "12 Example Lane\nSpringfield, ST 00000")
        await pg.fill("#coHeard", "Instagram")
        await pg.wait_for_timeout(200)
        check(not await pg.is_visible("#coError"), "error banner clears once fields are fixed")
        await pg.evaluate("document.getElementById('custom-order').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.locator(".co-card").screenshot(path=str(OUT / "custom-order.png"))
        await pg.click("#coSubmit"); await pg.wait_for_url("**/thanks.html", timeout=8000); await pg.wait_for_load_state("networkidle")
        check(len(captured) == 1, "exactly one (mocked) POST")
        c = captured[-1]; body = c["body"]
        check(c["url"] == "https://formsubmit.co/zafechokola@gmail.com" and c["method"] == "POST", "action URL + POST")
        check(c["ctype"].startswith("multipart/form-data"), "multipart/form-data encoding")
        check(part(body, "_subject") == "New custom order request from Jordan Blake", "_subject")
        check(part(body, "_template") == "table" and part(body, "_replyto") == "jordan@example.com" and part(body, "_honey") == "", "_template/_replyto/_honey")
        check(part(body, "_next") == base + "thanks.html", "_next points to thanks.html on this site")
        check(part(body, "_captcha") is None, "_captcha left at FormSubmit default (reCAPTCHA on)")
        check(part(body, "date_needed") == ok and part(body, "shape") == "Custom shape" and "number 30" in (part(body, "shape_description") or ""), "date/shape fields")
        check(part(body, "delivery") == "Ship to me" and "Example Lane" in (part(body, "shipping_address") or ""), "delivery + address")
        check(b'name="attachment"; filename="logo.png"' in body and b'name="attachment_2"; filename="brief.pdf"' in body, "both files attached (PNG + PDF)")
        # (Chromium's request interception omits the bytes of file parts; the local echo test below checks them.)
        txt = await pg.inner_text("body")
        check("We’ll be in touch by email to talk through your custom order." in txt and "Genelle" not in txt, "success copy (uses 'we')")
        await pg.set_viewport_size({"width": 1440, "height": 900})
        await pg.screenshot(path=str(OUT / "custom-order-success.png"))
        await ctx.close()

        # ---- Mobile: market pickup, no files ----
        ctx, pg = await page(b, base, {"width": 390, "height": 3400}, True)
        await pg.fill("#coName", "Sam Lee"); await pg.fill("#coEmail", "sam@example.com")
        await pg.select_option("#coOccasion", "Baby shower"); await pg.select_option("#coType", "White"); await pg.select_option("#coShape", "Round")
        await pg.fill("#coQty", "24"); await pg.fill("#coColours", "Soft blue and white")
        await pg.fill("#coDesc", "Two dozen small white chocolate rounds with little blue rattles for a baby shower.")
        await pg.fill("#coDate", ok); await pg.dispatch_event("#coDate", "change")
        await pg.check("input[name=delivery][value='Pick up at a market or event']")
        check(not await pg.is_visible("#coAddress"), "address hidden for market pickup")
        await pg.wait_for_timeout(200)
        await pg.evaluate("document.getElementById('custom-order').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.locator(".co-card").screenshot(path=str(OUT / "custom-order-mobile.png"))
        n = len(captured)
        await pg.click("#coSubmit"); await pg.wait_for_url("**/thanks.html", timeout=8000)
        body = captured[-1]["body"] if len(captured) > n else b""
        await pg.set_viewport_size({"width": 390, "height": 844}); await pg.screenshot(path=str(OUT / "custom-order-success-mobile.png"))
        check(part(body, "delivery") == "Pick up at a market or event" and (part(body, "shipping_address") or "") == "", "pickup submission without address")
        await ctx.close()

        # ---- File bytes: same form, action pointed at the local echo server (still never contacts FormSubmit) ----
        ctx, pg = await page(b, base, {"width": 1440, "height": 900}, False)
        await pg.evaluate("u => document.getElementById('customForm').action = u", base + "__echo")
        await pg.fill("#coName", "Echo Test"); await pg.fill("#coEmail", "echo@example.com")
        await pg.fill("#coDesc", "File transmission check."); await pg.fill("#coDate", ok); await pg.dispatch_event("#coDate", "change")
        await pg.fill("#coAddress", "1 Test Street")
        await pg.set_input_files("#coFile1", str(TMP / "brief.pdf"))
        await pg.click("#coSubmit"); await pg.wait_for_url("**/thanks.html", timeout=8000)
        eb = echoed[-1] if echoed else b""
        check(b'filename="brief.pdf"' in eb and b"% test reference" in eb, "file bytes actually transmitted in multipart body")
        await ctx.close(); await b.close()
    srv.shutdown()
    print("requests intercepted:", len(captured), "(all mocked; none reached formsubmit.co)")
    print("RESULT:", "ALL PASS" if not errors else "FAILURES: " + "; ".join(errors))

asyncio.run(main())
