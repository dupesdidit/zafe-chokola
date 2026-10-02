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

  renderProducts();
  renderCart();
})();
