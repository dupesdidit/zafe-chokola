/* Zafe Chokola — UI + client-side cart (localStorage). No real payments. */
(function () {
  "use strict";
  var PRODUCTS = window.ZC_PRODUCTS || [];
  var STORAGE_KEY = "zafeChokola.cart.v1";
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

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
          '<p class="p-detail">' + esc(p.detail) + "</p>" +
          "<h3>" + esc(p.name) + "</h3>" +
          '<p class="p-desc">' + esc(p.description) + "</p>" +
          '<div class="p-foot">' +
            '<span class="p-price">' + money(p.price) + "</span>" +
            '<button class="btn btn-small ' + (isGift ? "btn-gold" : "btn-dark") + '" data-add="' + esc(p.id) + '">Add to bag</button>' +
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
            '<p class="ci-detail">' + esc(p.detail) + " · " + money(p.price) + "</p>" +
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
  var drawer = $("#cartDrawer"), backdrop = $("#cartBackdrop"), modal = $("#orderModal");
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
  /* ---------- Order form (emailed via FormSubmit; no payment taken) ---------- */
  // Swap this for Genelle's random FormSubmit alias later (https://formsubmit.co/ajax/<alias>) to hide the address.
  var ORDER_ENDPOINT = "https://formsubmit.co/ajax/zafechokola@gmail.com";
  var ORDER_EMAIL = "Zafechokola@gmail.com";
  var form = $("#orderForm"), success = $("#orderSuccess"), lastFocus = null;
  var pick = {};          // quantities chosen in the form when the bag is empty
  var useCart = false;    // true when the order comes from the bag

  function orderLines() {
    var src = useCart ? cart : pick;
    return Object.keys(src).filter(function (id) { return byId[id] && src[id] > 0; }).map(function (id) {
      var p = byId[id], q = src[id];
      return { id: id, name: p.name, qty: q, price: p.price, total: p.price * q };
    });
  }
  function orderTotal(lines) { return lines.reduce(function (a, l) { return a + l.total; }, 0); }
  function summaryHTML(lines) {
    return lines.map(function (l) {
      return '<div><span>' + l.qty + " × " + esc(l.name) + ' <small>@ ' + money(l.price) + '</small></span><span>' + money(l.total) + "</span></div>";
    }).join("") + '<div class="ms-total"><span>Subtotal</span><span>' + money(orderTotal(lines)) + "</span></div>";
  }
  function renderOrderItems() {
    var box = $("#orderItems");
    if (useCart) {
      box.innerHTML = '<p class="of-hint">From your bag:</p><div class="modal-summary">' + summaryHTML(orderLines()) + '</div>' +
        '<button type="button" class="text-btn" id="editBag">Edit bag</button>';
      return;
    }
    box.innerHTML = '<p class="of-hint">Choose quantities:</p>' + PRODUCTS.map(function (p) {
      var q = pick[p.id] || 0;
      return '<div class="pick-row">' +
        '<label for="pick-' + esc(p.id) + '"><span class="pick-name">' + esc(p.name) + '</span> <span class="pick-price">' + money(p.price) + (p.id === "kids-pops" ? " each" : "") + "</span></label>" +
        '<div class="qty"><button type="button" data-pdec="' + esc(p.id) + '" aria-label="Fewer ' + esc(p.name) + '">&minus;</button>' +
        '<input id="pick-' + esc(p.id) + '" type="number" min="0" max="99" inputmode="numeric" value="' + q + '" data-pick="' + esc(p.id) + '" />' +
        '<button type="button" data-pinc="' + esc(p.id) + '" aria-label="More ' + esc(p.name) + '">+</button></div>' +
        '<span class="pick-total" aria-live="polite">' + money(p.price * q) + "</span></div>";
    }).join("") + '<div class="modal-summary pick-sum"><div class="ms-total"><span>Subtotal</span><span id="pickSubtotal">' + money(orderTotal(orderLines())) + "</span></div></div>";
  }
  function setPick(id, q) {
    pick[id] = Math.max(0, Math.min(99, q | 0));
    var input = $("#pick-" + id); if (input) input.value = pick[id];
    var row = input && input.closest(".pick-row"); if (row) row.querySelector(".pick-total").textContent = money(byId[id].price * pick[id]);
    $("#pickSubtotal").textContent = money(orderTotal(orderLines()));
    if (orderLines().length) $("#itemsError").hidden = true;
  }
  function syncAddress() {
    var ship = form.querySelector('input[name="delivery"]:checked');
    var isShip = !!ship && ship.value === "Ship to me";
    $("#addressField").hidden = !isShip;
    $("#ofAddress").required = isShip;
  }
  function openModal() {
    lastFocus = document.activeElement;
    useCart = count() > 0;
    form.hidden = false; success.hidden = true;
    $("#formError").hidden = true; $("#itemsError").hidden = true;
    renderOrderItems(); syncAddress();
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    setTimeout(function () { $("#ofName").focus({ preventScroll: true }); }, 30);
  }
  function closeModal() {
    modal.hidden = true;
    if (!drawer.classList.contains("open")) document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function fieldVal(name) { var el = form.elements[name]; return el ? String(el.value || "").trim() : ""; }
  function radioVal(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
  function mailtoFallback(lines) {
    var body = "Hello! I'd like to order:\n" + lines.map(function (l) { return l.qty + " x " + l.name + " = " + money(l.total); }).join("\n") +
      "\nSubtotal: " + money(orderTotal(lines)) + "\n\nName: " + fieldVal("name") + "\nDelivery: " + radioVal("delivery") +
      (radioVal("delivery") === "Ship to me" ? "\nAddress: " + fieldVal("shipping_address") : "") + "\nPayment: " + radioVal("payment") +
      (fieldVal("phone") ? "\nPhone: " + fieldVal("phone") : "") + (fieldVal("notes") ? "\nNotes: " + fieldVal("notes") : "");
    return "mailto:" + ORDER_EMAIL + "?subject=" + encodeURIComponent("Zafe Chokola order from " + fieldVal("name")) + "&body=" + encodeURIComponent(body);
  }
  function showError(html) { var e = $("#formError"); e.innerHTML = html; e.hidden = false; e.scrollIntoView({ block: "nearest" }); }

  form.addEventListener("change", function (e) {
    if (e.target.name === "delivery") syncAddress();
    if (e.target.dataset && e.target.dataset.pick) setPick(e.target.dataset.pick, parseInt(e.target.value, 10) || 0);
  });
  form.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    if (t.dataset.pinc) setPick(t.dataset.pinc, (pick[t.dataset.pinc] || 0) + 1);
    else if (t.dataset.pdec) setPick(t.dataset.pdec, (pick[t.dataset.pdec] || 0) - 1);
    else if (t.id === "editBag") { closeModal(); openCart(); }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    $("#formError").hidden = true;
    var lines = orderLines();
    $("#itemsError").hidden = lines.length > 0;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!lines.length) { $("#itemsError").scrollIntoView({ block: "nearest" }); return; }
    var name = fieldVal("name"), email = fieldVal("email"), isShip = radioVal("delivery") === "Ship to me";
    var payload = {
      name: name,
      email: email,
      phone: fieldVal("phone") || "(not given)",
      delivery: radioVal("delivery"),
      shipping_address: isShip ? fieldVal("shipping_address") : "(pickup at a market or event)",
      payment: radioVal("payment"),
      order: lines.map(function (l) { return l.qty + " × " + l.name + " @ " + money(l.price) + " = " + money(l.total); }).join("\n"),
      subtotal: money(orderTotal(lines)),
      notes: fieldVal("notes") || "(none)",
      _subject: "New Zafe Chokola order from " + name,
      _template: "table",
      _captcha: "false",
      _replyto: email,
      _honey: fieldVal("_honey")
    };
    var btn = $("#orderSubmit"); btn.disabled = true; btn.textContent = "Sending…";
    fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || String(data.success) === "false") throw new Error(data.message || ("HTTP " + res.status));
      });
    }).then(function () {
      $("#successSummary").innerHTML = summaryHTML(lines);
      form.reset(); pick = {};
      if (useCart) { cart = {}; save(); renderCart(); }
      form.hidden = true; success.hidden = false; success.focus();
    }).catch(function () {
      showError("Sorry, we couldn&rsquo;t send your order just now. Please try again, or email it to us at " +
        '<a class="inline-link" href="' + esc(mailtoFallback(lines)) + '">' + ORDER_EMAIL + "</a> and we&rsquo;ll take care of you.");
    }).then(function () { btn.disabled = false; btn.textContent = "Send my order"; });
  });

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
    // FUTURE (needs owner approval): online card payment (Stripe) could replace the emailed order here.
    closeCart(); openModal();
  });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-order-open]")) { e.preventDefault(); openModal(); } });
  $("#orderClose").addEventListener("click", closeModal);
  $("#successOk").addEventListener("click", closeModal);
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

  renderProducts();
  renderCart();
})();
