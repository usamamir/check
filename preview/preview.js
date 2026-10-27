(function () {
  var KEY = "jt_preview_cart";
  var SEED = [
    { id: "vest-multi", title: "RS-25P Fade Side Entry Impact Vest | Multi", price: 102.89, qty: 1, img: "images/p1.jpg", option: "Size: L" },
    { id: "towel", title: "*NEW* Beach Towel | Extra Large 73 Inch", price: 26.29, qty: 2, img: "images/p8.jpg", option: "" }
  ];

  function money(n) { return "$" + n.toFixed(2); }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        localStorage.setItem(KEY, JSON.stringify(SEED));
        return SEED.slice();
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED.slice();
    }
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    paint(items);
  }
  function count(items) {
    return items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }
  function total(items) {
    return items.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  function paint(items) {
    qsa("[data-cart-count]").forEach(function (el) { el.textContent = count(items); });
    var body = qs("[data-cart-body]");
    var foot = qs("[data-cart-foot]");
    if (body) {
      if (!items.length) {
        body.innerHTML = "<p>Your cart is empty.</p>";
        if (foot) foot.hidden = true;
      } else {
        body.innerHTML = items.map(function (item) {
          return '<article class="drawer-line"><img src="' + item.img + '" alt=""><div><strong>' + item.title + '</strong>' +
            (item.option ? "<div>" + item.option + "</div>" : "") +
            "<div>" + money(item.price * item.qty) + "</div>" +
            '<input class="input" style="width:72px;margin-top:6px" type="number" min="0" value="' + item.qty + '" data-qty="' + item.id + '">' +
            '<button type="button" class="remove-link" data-remove="' + item.id + '">Remove</button></div></article>';
        }).join("");
        if (foot) foot.hidden = false;
        var sum = qs("[data-cart-total]");
        if (sum) sum.textContent = money(total(items));
        var ship = qs("[data-ship-message]");
        if (ship) {
          var left = 400 - total(items);
          ship.textContent = left <= 0 ? "This order qualifies for free USA shipping." : "Add " + money(left) + " more for free USA shipping.";
        }
      }
    }
    var page = qs("[data-cart-page]");
    if (page) {
      document.body.classList.toggle("is-empty-cart", items.length === 0);
      var rows = qs("[data-cart-rows]");
      if (rows) {
        rows.innerHTML = items.map(function (item) {
          return "<tr><td><div class=\"cart-product\"><img src=\"" + item.img + "\" alt=\"\" width=\"84\" height=\"84\"><div><strong>" + item.title + "</strong>" +
            (item.option ? "<div>" + item.option + "</div>" : "") +
            "<button type=\"button\" class=\"remove-link\" data-remove=\"" + item.id + "\">Remove</button></div></div></td>" +
            "<td>" + money(item.price) + "</td><td><input class=\"input\" style=\"width:80px\" type=\"number\" min=\"0\" value=\"" + item.qty + "\" data-qty=\"" + item.id + "\"></td>" +
            "<td>" + money(item.price * item.qty) + "</td></tr>";
        }).join("");
      }
      var sub = qs("[data-page-subtotal]");
      if (sub) sub.textContent = money(total(items));
      var bar = qs("[data-ship-bar]");
      var note = qs("[data-page-ship]");
      var pct = Math.min(100, Math.round(total(items) / 400 * 100));
      if (bar) bar.style.width = pct + "%";
      if (note) {
        var left = 400 - total(items);
        note.textContent = left <= 0 ? "This order qualifies for free USA shipping." : "Add " + money(left) + " more for free USA shipping on orders $400+.";
      }
    }
  }

  var toggle = qs("[data-menu-toggle]");
  var nav = qs("[data-site-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    qsa(".nav-item.has-sub > a", nav).forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (window.matchMedia("(max-width: 991px)").matches) {
          event.preventDefault();
          link.parentElement.classList.toggle("is-open");
        }
      });
    });
  }

  qsa("[data-slider]").forEach(function (root) {
    var slides = qsa("[data-slide]", root);
    if (!slides.length) return;
    var index = 0;
    var dots = qs("[data-dots]", root);
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === index); });
      if (dots) qsa("button", dots).forEach(function (dot, i) { dot.classList.toggle("is-active", i === index); });
    }
    if (dots) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        dot.addEventListener("click", function () { show(i); });
        dots.appendChild(dot);
      });
    }
    var prev = qs("[data-prev]", root);
    var next = qs("[data-next]", root);
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    show(0);
    if (root.hasAttribute("data-autoplay")) setInterval(function () { show(index + 1); }, 4000);
  });

  var backdrop = qs("[data-cart-backdrop]");
  var drawer = qs("[data-cart-drawer]");
  function openCart(event) {
    if (event) event.preventDefault();
    if (drawer) drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
  }
  function closeCart() {
    if (drawer) drawer.hidden = true;
    if (backdrop) backdrop.hidden = true;
  }
  qsa("[data-open-cart]").forEach(function (el) { el.addEventListener("click", openCart); });
  qsa("[data-close-cart]").forEach(function (el) { el.addEventListener("click", closeCart); });

  document.addEventListener("click", function (event) {
    var add = event.target.closest("[data-add]");
    if (add) {
      event.preventDefault();
      var items = load();
      var id = add.getAttribute("data-add");
      var found = items.filter(function (item) { return item.id === id; })[0];
      if (found) found.qty += 1;
      else items.push({
        id: id,
        title: add.getAttribute("data-title"),
        price: Number(add.getAttribute("data-price")),
        qty: 1,
        img: add.getAttribute("data-img"),
        option: add.getAttribute("data-option") || ""
      });
      save(items);
      openCart();
    }
    var remove = event.target.closest("[data-remove]");
    if (remove) {
      save(load().filter(function (item) { return item.id !== remove.getAttribute("data-remove"); }));
    }
    var quick = event.target.closest("[data-quick]");
    if (quick) {
      event.preventDefault();
      var modal = qs("[data-quick-modal]");
      var box = qs("[data-quick-body]");
      if (box) {
        box.innerHTML = '<div class="quick-grid"><div><img src="' + quick.getAttribute("data-img") + '" alt=""></div><div><h3>' +
          quick.getAttribute("data-title") + '</h3><div class="price">Now: ' + money(Number(quick.getAttribute("data-price"))) +
          '</div><button class="btn btn--full" type="button" data-add="' + quick.getAttribute("data-quick") + '" data-title="' +
          quick.getAttribute("data-title") + '" data-price="' + quick.getAttribute("data-price") + '" data-img="' + quick.getAttribute("data-img") +
          '">Add to Cart</button><p style="margin-top:10px"><a href="product.html">View full details</a></p></div></div>';
      }
      if (modal) modal.hidden = false;
      var shade = qs("[data-modal-backdrop]");
      if (shade) shade.hidden = false;
    }
    if (event.target.closest("[data-close-quick]")) {
      var modal2 = qs("[data-quick-modal]");
      var shade2 = qs("[data-modal-backdrop]");
      if (modal2) modal2.hidden = true;
      if (shade2) shade2.hidden = true;
    }
  });

  document.addEventListener("change", function (event) {
    var input = event.target.closest("[data-qty]");
    if (!input) return;
    var items = load().map(function (item) {
      if (item.id === input.getAttribute("data-qty")) item.qty = Number(input.value || 0);
      return item;
    }).filter(function (item) { return item.qty > 0; });
    save(items);
  });

  qsa("[data-option-group]").forEach(function (group) {
    group.addEventListener("change", function (event) {
      qsa("label", group).forEach(function (label) { label.classList.remove("is-selected"); });
      if (event.target.closest("label")) event.target.closest("label").classList.add("is-selected");
    });
  });

  qsa("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      qsa("[data-tab]").forEach(function (el) { el.classList.remove("is-active"); });
      qsa("[data-tab-panel]").forEach(function (el) { el.classList.remove("is-active"); });
      tab.classList.add("is-active");
      var panel = qs('[data-tab-panel="' + tab.getAttribute("data-tab") + '"]');
      if (panel) panel.classList.add("is-active");
    });
  });

  qsa("[data-thumb]").forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      var main = qs("[data-gallery-main]");
      if (main) main.src = thumb.getAttribute("data-src");
      qsa("[data-thumb]").forEach(function (el) { el.classList.remove("is-active"); });
      thumb.classList.add("is-active");
    });
  });

  var contact = qs("[data-contact]");
  if (contact) {
    contact.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = qs("[data-contact-ok]");
      if (ok) ok.hidden = false;
      contact.reset();
    });
  }

  var productForm = qs("[data-product-add]");
  if (productForm) {
    productForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var size = (qs("[data-option-group] input:checked") || {}).value || "L";
      var btn = qs("[data-product-add] [data-add]");
      if (btn) btn.setAttribute("data-option", "Size: " + size);
      var items = load();
      var id = "vest-multi-" + size;
      var found = items.filter(function (item) { return item.id === id; })[0];
      if (found) found.qty += Number((qs("#Quantity") || {}).value || 1);
      else items.push({
        id: id,
        title: "RS-25P Fade Side Entry Impact Vest | Multi",
        price: 102.89,
        qty: Number((qs("#Quantity") || {}).value || 1),
        img: "images/p1.jpg",
        option: "Size: " + size
      });
      save(items);
      openCart();
    });
  }

  paint(load());
})();
