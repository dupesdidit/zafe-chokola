/* Zafe Chokola — UI + client-side cart (localStorage). No real payments. */
(function () {
  "use strict";
  var FALLBACK = window.ZC_PRODUCTS || [];
  var PRODUCTS = FALLBACK;
  var STORAGE_KEY = "zafeChokola.cart.v1";
  var byId = {};
  function indexProducts() { byId = {}; PRODUCTS.forEach(function (p) { byId[p.id] = p; }); }
  indexProducts();

  var $ = function (s) { return document.querySelector(s); };
  var money = function (n) { return "$" + n.toFixed(2); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- Cart state ---------- */
  var cart = load();
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      var clean = {};
      Object.keys(raw).forEach(function (id) {
        var q = parseInt(raw[id], 10);
        if (byId[id] && q > 0) clean[id] = Math.min(q, 99);
      });
      return clean;
    } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function setQty(id, q) {
    q = Math.max(0, Math.min(99, q | 0));
    if (q === 0) delete cart[id]; else cart[id] = q;
    save(); renderCart();
  }
  function add(id, n) { setQty(id, (cart[id] || 0) + (n || 1)); }
  function count() { return Object.keys(cart).reduce(function (a, id) { return a + cart[id]; }, 0); }
  function subtotal() { return Object.keys(cart).reduce(function (a, id) { return a + cart[id] * byId[id].price; }, 0); }

  /* ---------- Images: local photo slot with stock fallback ---------- */
  // Any <img data-fallback="..."> whose local file is missing swaps to the fallback URL once.
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.dataset.fallback && img.src !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
      delete img.dataset.fallback;
    }
  }, true);
  // Static images that already failed before this script ran (e.g. the story photo)
  Array.prototype.forEach.call(document.querySelectorAll("img[data-fallback]"), function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) { img.src = img.dataset.fallback; delete img.dataset.fallback; }
  });
  function imgTag(p, alt, lazy) {
    if (!p.image) return '<div class="p-noimg" aria-hidden="true">Zafe Chokola</div>';
    return '<img src="' + esc(p.image) + '"' + (p.fallback ? ' data-fallback="' + esc(p.fallback) + '"' : "") +
      ' alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy"' : "") + " />";
  }

  /* ---------- Product rendering ---------- */
  function card(p, isGift) {
    return (
      '<article class="' + (isGift ? "gift-card" : "product-card") + '">' +
        '<div class="p-media">' +
          (p.badge ? '<span class="p-badge">' + esc(p.badge) + "</span>" : "") +
          imgTag(p, p.name, true) +
        "</div>" +
        '<div class="p-body">' +
          (p.detail ? '<p class="p-detail">' + esc(p.detail) + "</p>" : "") +
          "<h3>" + esc(p.name) + "</h3>" +
          '<p class="p-desc">' + esc(p.description) + "</p>" +
          '<div class="p-foot">' +
            '<span class="p-price">' + money(p.price) + "</span>" +
            '<span class="p-actions">' +
              (p.stripePaymentLink ? '<a class="btn btn-small btn-gold" href="' + esc(p.stripePaymentLink) + '" rel="noopener">Buy now</a>' : "") +
              '<button class="btn btn-small ' + (isGift ? "btn-gold" : "btn-dark") + '" data-add="' + esc(p.id) + '">Add to bag</button>' +
            "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }
  function renderProducts() {
    $("#collectionGrid").innerHTML = PRODUCTS.filter(function (p) { return p.category === "collection"; }).map(function (p) { return card(p, false); }).join("");
    // Gift boxes: none offered right now. If "gift" products are added later, add a #giftGrid section back to index.html.
    var giftGrid = $("#giftGrid");
    if (giftGrid) giftGrid.innerHTML = PRODUCTS.filter(function (p) { return p.category === "gift"; }).map(function (p) { return card(p, true); }).join("");
  }

  /* ---------- Live catalogue from the Google Sheet ----------
     Fallback-first: the hardcoded list (or the last good sheet copy cached in localStorage) renders
     immediately; the sheet is fetched in the background with a timeout and swapped in when it arrives.
     ?sheet=<id> in the page URL overrides the sheet id (testing); ?sheet=off disables it. */
  var SHEET = window.ZC_SHEET || {};
  var SHEET_CACHE_KEY = "zafeChokola.sheet.v1";
  function slug(s) { return String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i, c;
    text = String(text).replace(/^\uFEFF/, "");
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(f); rows.push(row); row = []; f = "";
      } else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function photoUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=|thumbnail\?(?:.*&)?id=)([\w-]{10,})/) ||
            u.match(/docs\.google\.com\/uc\?(?:.*&)?id=([\w-]{10,})/);
    if (m) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1200";
    return /^https:\/\//i.test(u) ? u : "";
  }
  function truthy(v) { return /^(true|yes|y|1|x|✓|✔)$/i.test(String(v).trim()); }
  function rowsToProducts(rows) {
    if (!rows.length) return null;
    var head = rows[0].map(function (h) { return slug(h); });
    var col = function (name) { return head.indexOf(name); };
    var iName = col("name"), iPrice = col("price");
    if (iName < 0 || iPrice < 0) return null;
    var get = function (r, name) { var i = col(name); return i < 0 ? "" : String(r[i] == null ? "" : r[i]).trim(); };
    var fbById = {}; FALLBACK.forEach(function (p) { fbById[p.id] = p; });
    var seen = {}, out = [];
    rows.slice(1).forEach(function (r, n) {
      var name = get(r, "name");
      var price = parseFloat(get(r, "price").replace(/[^0-9.\-]/g, ""));
      if (!name || !(price >= 0)) return;
      if (col("show") >= 0 && !truthy(get(r, "show"))) return;
      var id = slug(name) || "item-" + n;
      if (seen[id]) return; seen[id] = 1;
      var fb = fbById[id] || {};
      var photo = photoUrl(get(r, "photo"));
      var stripe = get(r, "stripe-payment-link");
      var sort = parseFloat(get(r, "sort-order"));
      out.push({
        id: id, category: "collection", name: name,
        detail: get(r, "price-note"),
        description: get(r, "description"),
        price: Math.round(price * 100) / 100,
        image: photo || fb.image || "",
        fallback: photo ? (fb.image || fb.fallback || "") : (fb.fallback || ""),
        badge: get(r, "category"),
        stripePaymentLink: /^https:\/\//i.test(stripe) ? stripe : "",
        _sort: isNaN(sort) ? 1e6 + n : sort, _n: n
      });
    });
    out.sort(function (a, b) { return a._sort - b._sort || a._n - b._n; });
    return out;
  }
  function useProducts(list) {
    if (!list) return false;
    PRODUCTS = list; indexProducts();
    renderProducts();
    cart = load(); renderCart();   // re-read the stored bag against the new catalogue
    document.documentElement.setAttribute("data-catalogue", list === FALLBACK ? "fallback" : "sheet");
    return true;
  }
  function loadSheet() {
    var qs = location.search.match(/[?&]sheet=([^&]*)/);
    var id = qs ? decodeURIComponent(qs[1]) : SHEET.id;
    if (!id || id === "off" || !window.fetch) return;
    var cached; try { cached = localStorage.getItem(SHEET_CACHE_KEY + ":" + id); } catch (e) {}
    if (cached) { try { useProducts(rowsToProducts(parseCSV(cached))); } catch (e) {} }
    var url = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(id) +
      "/gviz/tq?tqx=out:csv&headers=1&sheet=" + encodeURIComponent(SHEET.tab || "Products");
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, SHEET.timeoutMs || 3000);
    fetch(url, { signal: ctrl ? ctrl.signal : undefined, credentials: "omit", cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("sheet " + r.status); return r.text(); })
      .then(function (text) {
        clearTimeout(timer);
        var list = rowsToProducts(parseCSV(text));
        if (!list || !list.length) throw new Error("sheet empty or headings changed");
        if (text !== cached) useProducts(list);
        else document.documentElement.setAttribute("data-catalogue", "sheet");
        try { localStorage.setItem(SHEET_CACHE_KEY + ":" + id, text); } catch (e) {}
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (window.console) console.info("Zafe Chokola: using built-in product list (" + (err && err.name === "AbortError" ? "sheet timed out" : err && err.message) + ")");
      });
  }

  /* ---------- Cart rendering ---------- */
  function renderCart() {
    var ids = Object.keys(cart);
    var c = count();
    var badge = $("#cartCount");
    badge.textContent = c;
    badge.classList.toggle("has-items", c > 0);
    $("#cartSubtotal").textContent = money(subtotal());
    $("#checkoutBtn").disabled = c === 0;
    $("#clearCart").hidden = c === 0;

    if (!ids.length) {
      $("#cartItems").innerHTML =
        '<div class="cart-empty"><p>Your bag is empty.</p><a href="#shop" class="link-arrow" data-close>Browse the treats &rarr;</a></div>';
      return;
    }
    $("#cartItems").innerHTML = ids.map(function (id) {
      var p = byId[id], q = cart[id];
      return (
        '<div class="cart-item">' +
          imgTag(p, "", false) +
          '<div class="ci-info">' +
            '<p class="ci-name">' + esc(p.name) + "</p>" +
            '<p class="ci-detail">' + (p.detail ? esc(p.detail) + " · " : "") + money(p.price) + "</p>" +
            '<div class="qty">' +
              '<button data-dec="' + id + '" aria-label="Decrease quantity">&minus;</button>' +
              '<input type="number" min="0" max="99" value="' + q + '" data-qty="' + id + '" aria-label="Quantity" />' +
              '<button data-inc="' + id + '" aria-label="Increase quantity">+</button>' +
            "</div>" +
          "</div>" +
          '<div class="ci-right"><span>' + money(p.price * q) + '</span><button class="text-btn" data-remove="' + id + '">Remove</button></div>' +
        "</div>"
      );
    }).join("");
  }

  /* ---------- Drawer / modal ---------- */
  var drawer = $("#cartDrawer"), backdrop = $("#cartBackdrop"), modal = $("#checkoutModal");
  function openCart() {
    backdrop.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add("open"); backdrop.classList.add("show"); });
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeCart() {
    drawer.classList.remove("open"); backdrop.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    setTimeout(function () { if (!drawer.classList.contains("open")) backdrop.hidden = true; }, 300);
  }
  function openModal() {
    var ids = Object.keys(cart);
    $("#modalSummary").innerHTML =
      ids.map(function (id) { return "<div><span>" + cart[id] + " × " + esc(byId[id].name) + "</span><span>" + money(byId[id].price * cart[id]) + "</span></div>"; }).join("") +
      '<div class="ms-total"><span>Subtotal</span><span>' + money(subtotal()) + "</span></div>";
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- Events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t) return;
    var d = t.dataset;
    if (d.add) { add(d.add, 1); toast(byId[d.add].name + " added to your bag"); t.textContent = "Added ✓"; setTimeout(function () { t.textContent = "Add to bag"; }, 1200); }
    else if (d.inc) setQty(d.inc, cart[d.inc] + 1);
    else if (d.dec) setQty(d.dec, cart[d.dec] - 1);
    else if (d.remove) setQty(d.remove, 0);
    else if ("close" in d) closeCart();
  });
  document.addEventListener("change", function (e) {
    var id = e.target.dataset && e.target.dataset.qty;
    if (id) setQty(id, parseInt(e.target.value, 10) || 0);
  });
  $("#cartOpen").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
  $("#clearCart").addEventListener("click", function () { cart = {}; save(); renderCart(); });
  $("#checkoutBtn").addEventListener("click", function () {
    if (!count()) return;
    // FUTURE (needs owner approval): redirect to Stripe Payment Link / Checkout session using product.stripePaymentLink.
    openModal();
  });
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalOk").addEventListener("click", function () { closeModal(); closeCart(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!modal.hidden) closeModal(); else closeCart(); }
  });
  // Sync cart across tabs
  window.addEventListener("storage", function (e) { if (e.key === STORAGE_KEY) { cart = load(); renderCart(); } });

  /* ---------- Nav ---------- */
  var toggle = $("#menuToggle"), links = $("#navLinks");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { links.classList.remove("open"); toggle.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  });
  var header = $(".site-header");
  window.addEventListener("scroll", function () { header.classList.toggle("scrolled", window.scrollY > 40); }, { passive: true });

  /* ---------- Custom order request form (#custom-order) ----------
   * Native multipart POST to FormSubmit (https://formsubmit.co/zafechokola@gmail.com) so file uploads work;
   * FormSubmit's AJAX endpoint is JSON-only in its docs. This script only validates and fills the hidden
   * _subject/_replyto/_next fields, then lets the browser submit. See HANDOFF.md §4a. */
  var co = $("#customForm");
  if (co) (function () {
    var MIN_DAYS = 21, MAX_BYTES = 5 * 1024 * 1024;
    var files = [$("#coFile1"), $("#coFile2"), $("#coFile3")];
    var okType = function (f) { return /^image\//.test(f.type) || /\.pdf$/i.test(f.name) || f.type === "application/pdf" || /\.(heic|heif)$/i.test(f.name); };
    function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
    function earliest() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + MIN_DAYS); return d; }
    var dateIn = $("#coDate"); dateIn.min = ymd(earliest());

    function show(el, msg) { el.textContent = msg; el.hidden = !msg; }
    function syncShip() {
      var ship = (co.querySelector('input[name="delivery"]:checked') || {}).value === "Ship to me";
      $("#coAddressField").hidden = !ship; $("#coAddress").required = ship;
      if (!ship) $("#coAddress").removeAttribute("aria-invalid");
    }
    function syncShape() {
      var custom = $("#coShape").value === "Custom shape";
      $("#shapeDescField").hidden = !custom; $("#coShapeDesc").required = custom;
    }
    function checkDate() {
      var v = dateIn.value, msg = "";
      if (!v) msg = "Please choose the date you need your chocolates.";
      else {
        var p = v.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
        if (d < earliest()) msg = "Custom orders need at least 3 weeks\u2019 notice, so the earliest date we can offer is " +
          earliest().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) + ". For anything sooner, please email us and we\u2019ll see what we can do.";
      }
      show($("#dateMsg"), msg); dateIn.setAttribute("aria-invalid", msg ? "true" : "false"); dateIn.setCustomValidity(msg);
      return !msg;
    }
    function checkFiles() {
      var total = 0, msg = "";
      files.forEach(function (inp) { Array.prototype.forEach.call(inp.files || [], function (f) {
        total += f.size; if (!okType(f)) msg = "\u201c" + f.name + "\u201d isn\u2019t an image or PDF. Please choose a JPG, PNG, HEIC or PDF file.";
      }); });
      if (!msg && total > MAX_BYTES) msg = "Your files add up to " + (total / 1048576).toFixed(1) + " MB. Please keep the total under 5 MB (or email larger files to Zafechokola@gmail.com).";
      show($("#fileMsg"), msg); files.forEach(function (i) { i.setCustomValidity(msg); });
      // reveal the next empty slot once the previous one is used
      var next = files.filter(function (i) { return i.hidden; })[0];
      $("#addFile").hidden = !next || !files.some(function (i) { return !i.hidden && i.files && i.files.length; });
      return !msg;
    }
    $("#addFile").addEventListener("click", function () {
      var next = files.filter(function (i) { return i.hidden; })[0];
      if (next) { next.hidden = false; next.focus(); } checkFiles();
    });
    co.addEventListener("change", function (e) {
      if (e.target.name === "delivery") syncShip();
      if (e.target.id === "coShape") syncShape();
      if (e.target === dateIn) checkDate();
      if (e.target.type === "file") checkFiles();
      if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) e.target.setAttribute("aria-invalid", "false");
      if (!$("#coError").hidden && !co.querySelector('[aria-invalid="true"]')) show($("#coError"), "");
    });
    co.addEventListener("submit", function (e) {
      show($("#coError"), "");
      var okDate = checkDate(), okFiles = checkFiles();
      Array.prototype.forEach.call(co.querySelectorAll("input, select, textarea"), function (el) {
        if (el.type !== "hidden" && el.willValidate) el.setAttribute("aria-invalid", el.checkValidity() ? "false" : "true");
      });
      if (!co.checkValidity() || !okDate || !okFiles) {
        e.preventDefault();
        show($("#coError"), "Please check the highlighted fields.");
        var bad = co.querySelector('[aria-invalid="true"]'); if (bad) bad.focus();
        return;
      }
      var name = co.elements.name.value.trim();
      co.elements._subject.value = "New custom order request from " + name;
      co.elements._replyto.value = co.elements.email.value.trim();
      if (/^https?:$/.test(location.protocol)) co.elements._next.value = new URL("thanks.html", location.href).href;
      if (!$("#coAddress").required) $("#coAddress").value = "";
      $("#coSubmit").disabled = true; $("#coSubmit").textContent = "Sending\u2026";
      // let the browser submit natively (multipart/form-data, includes files)
    });
    window.addEventListener("pageshow", function () { $("#coSubmit").disabled = false; $("#coSubmit").textContent = "Send my request"; });
    syncShip(); syncShape();
  })();

  renderProducts();
  renderCart();
  document.documentElement.setAttribute("data-catalogue", "fallback");
  loadSheet();
})();
