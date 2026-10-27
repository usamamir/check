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
        var detailsUrl = quick.getAttribute("data-url") || "product.html";
        box.innerHTML = '<div class="quick-grid"><div><img src="' + quick.getAttribute("data-img") + '" alt=""></div><div><h3>' +
          quick.getAttribute("data-title") + '</h3><div class="price">Now: ' + money(Number(quick.getAttribute("data-price"))) +
          '</div><button class="btn btn--full" type="button" data-add="' + quick.getAttribute("data-quick") + '" data-title="' +
          quick.getAttribute("data-title") + '" data-price="' + quick.getAttribute("data-price") + '" data-img="' + quick.getAttribute("data-img") +
          '">Add to Cart</button><p style="margin-top:10px"><a href="' + detailsUrl + '">View full details</a></p></div></div>';
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

  document.addEventListener("change", function (event) {
    var group = event.target.closest("[data-option-group]");
    if (!group) return;
    qsa("label", group).forEach(function (label) { label.classList.remove("is-selected"); });
    var label = event.target.closest("label");
    if (label) label.classList.add("is-selected");
  });

  document.addEventListener("click", function (event) {
    var tab = event.target.closest("[data-tab]");
    if (tab) {
      var scope = tab.closest(".product-lower") || document;
      qsa("[data-tab]", scope).forEach(function (el) { el.classList.remove("is-active"); });
      qsa("[data-tab-panel]", scope).forEach(function (el) { el.classList.remove("is-active"); });
      tab.classList.add("is-active");
      var panel = qs('[data-tab-panel="' + tab.getAttribute("data-tab") + '"]', scope);
      if (panel) panel.classList.add("is-active");
    }
    var thumb = event.target.closest("[data-thumb]");
    if (thumb) {
      var main = qs("[data-gallery-main]");
      if (main) main.src = thumb.getAttribute("data-src");
      qsa("[data-thumb]").forEach(function (el) { el.classList.remove("is-active"); });
      thumb.classList.add("is-active");
    }
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

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("[data-product-add]");
    if (!form) return;
    event.preventDefault();
    var opts = [];
    qsa("[data-option-group]", form).forEach(function (group) {
      var checked = qs("input:checked", group);
      if (checked) opts.push((group.getAttribute("data-option-name") || "Option") + ": " + checked.value);
    });
    qsa("input[type=text], textarea", form).forEach(function (field) {
      if (field.value) opts.push((field.name || "Note") + ": " + field.value);
    });
    var qty = Number((qs("[name=quantity]", form) || {}).value || 1);
    var id = (form.getAttribute("data-id") || "item") + "|" + opts.join("|");
    var items = load();
    var found = items.filter(function (item) { return item.id === id; })[0];
    if (found) found.qty += qty;
    else items.push({
      id: id,
      title: form.getAttribute("data-title") || "Jettribe",
      price: Number(form.getAttribute("data-price") || 0),
      qty: qty,
      img: form.getAttribute("data-img") || "",
      option: opts.join(", ")
    });
    save(items);
    openCart();
  });

  paint(load());

  var COMPARE_KEY = "jt_compare";
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function readCompare() {
    try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function writeCompare(list) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
    paintCompare();
  }
  function ensureCompare() {
    if (qs("[data-compare-bar]")) return;
    var bar = document.createElement("div");
    bar.className = "compare-bar";
    bar.setAttribute("data-compare-bar", "");
    bar.hidden = true;
    bar.innerHTML = '<div class="compare-bar-inner"><p data-compare-label>Compare</p><div class="compare-thumbs" data-compare-thumbs></div><button class="btn" type="button" data-compare-open>Compare</button><button class="compare-clear" type="button" data-compare-clear>Clear</button></div>';
    var modal = document.createElement("div");
    modal.className = "compare-modal";
    modal.setAttribute("data-compare-modal", "");
    modal.hidden = true;
    modal.innerHTML = '<div class="compare-panel" role="dialog" aria-modal="true" aria-label="Compare products"><div class="compare-panel-head"><h2>Compare</h2><button type="button" data-compare-close>Close</button></div><div class="compare-grid" data-compare-grid></div></div>';
    document.body.appendChild(bar);
    document.body.appendChild(modal);
  }
  function paintCompare() {
    ensureCompare();
    var list = readCompare();
    var bar = qs("[data-compare-bar]");
    bar.hidden = list.length === 0;
    document.body.classList.toggle("has-compare", list.length > 0);
    var label = qs("[data-compare-label]");
    if (label) label.textContent = list.length + " of 4 selected";
    var thumbs = qs("[data-compare-thumbs]");
    if (thumbs) {
      thumbs.innerHTML = list.map(function (item) {
        return '<button type="button" class="compare-thumb" data-compare-remove="' + esc(item.id) + '"><img src="' + esc(item.img) + '" alt=""><span>' + esc(item.title) + "</span></button>";
      }).join("");
    }
    var ids = list.map(function (item) { return String(item.id); });
    qsa("[data-compare-add]").forEach(function (input) {
      if (input.type === "checkbox") input.checked = ids.indexOf(String(input.getAttribute("data-id"))) !== -1;
    });
    qsa("[data-compare-button]").forEach(function (btn) {
      var on = ids.indexOf(String(btn.getAttribute("data-id"))) !== -1;
      btn.textContent = on ? "Added to compare" : "Compare";
    });
  }
  function itemFrom(el) {
    return {
      id: el.getAttribute("data-id"),
      title: el.getAttribute("data-title") || "",
      price: Number(el.getAttribute("data-price") || 0),
      img: el.getAttribute("data-img") || "",
      url: el.getAttribute("data-url") || "#"
    };
  }
  function addCompare(el) {
    var list = readCompare().filter(function (item) { return String(item.id) !== String(el.getAttribute("data-id")); });
    if (list.length >= 4) {
      var label = qs("[data-compare-label]");
      ensureCompare();
      if (qs("[data-compare-label]")) qs("[data-compare-label]").textContent = "Compare up to 4 products";
      qs("[data-compare-bar]").hidden = false;
      return false;
    }
    list.push(itemFrom(el));
    writeCompare(list);
    return true;
  }
  document.addEventListener("change", function (event) {
    var input = event.target.closest && event.target.closest("input[data-compare-add]");
    if (!input) return;
    var id = input.getAttribute("data-id");
    var list = readCompare().filter(function (item) { return String(item.id) !== String(id); });
    if (input.checked) {
      if (list.length >= 4) {
        input.checked = false;
        ensureCompare();
        qs("[data-compare-bar]").hidden = false;
        qs("[data-compare-label]").textContent = "Compare up to 4 products";
        return;
      }
      list.push(itemFrom(input));
    }
    writeCompare(list);
  });
  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-compare-button]");
    if (button) {
      event.preventDefault();
      var id = button.getAttribute("data-id");
      var list = readCompare();
      var exists = list.some(function (item) { return String(item.id) === String(id); });
      if (exists) writeCompare(list.filter(function (item) { return String(item.id) !== String(id); }));
      else addCompare(button);
      return;
    }
    var remove = event.target.closest && event.target.closest("[data-compare-remove]");
    if (remove) {
      var rid = remove.getAttribute("data-compare-remove");
      writeCompare(readCompare().filter(function (item) { return String(item.id) !== String(rid); }));
      var modal = qs("[data-compare-modal]");
      if (modal && !modal.hidden) {
        if (readCompare().length < 2) {
          modal.hidden = true;
          document.body.style.overflow = "";
        } else {
          qs("[data-compare-open]").click();
        }
      }
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-clear]")) {
      writeCompare([]);
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-open]")) {
      var picked = readCompare();
      if (picked.length < 2) {
        qs("[data-compare-label]").textContent = "Select at least 2 products";
        return;
      }
      qs("[data-compare-grid]").innerHTML = picked.map(function (item) {
        return '<article class="compare-col"><a href="' + esc(item.url) + '"><img src="' + esc(item.img) + '" alt=""></a><h3><a href="' + esc(item.url) + '">' + esc(item.title) + '</a></h3><p class="price">Now: ' + money(Number(item.price) || 0) + '</p><a class="btn" href="' + esc(item.url) + '">View</a><button type="button" class="remove-link" data-compare-remove="' + esc(item.id) + '">Remove</button></article>';
      }).join("");
      qs("[data-compare-modal]").hidden = false;
      document.body.style.overflow = "hidden";
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-close]")) {
      qs("[data-compare-modal]").hidden = true;
      document.body.style.overflow = "";
      return;
    }
    if (event.target.matches && event.target.matches("[data-compare-modal]")) {
      event.target.hidden = true;
      document.body.style.overflow = "";
    }
  });
  document.addEventListener("catalog:rendered", function () {
    paintCompare();
    var box = qs("[data-price-range]");
    if (!box || box.getAttribute("data-bound")) return;
    box.setAttribute("data-bound", "1");
    var minR = qs('[data-range="min"]', box);
    var maxR = qs('[data-range="max"]', box);
    var minN = qs("[data-price-min]", box);
    var maxN = qs("[data-price-max]", box);
    var minL = qs("[data-price-min-label]", box);
    var maxL = qs("[data-price-max-label]", box);
    function sync(which) {
      var a = Number(minR.value);
      var b = Number(maxR.value);
      if (a > b) {
        if (which === "min") { a = b; minR.value = String(a); }
        else { b = a; maxR.value = String(b); }
      }
      if (minN) minN.value = String(a);
      if (maxN) maxN.value = String(b);
      if (minL) minL.textContent = money(a);
      if (maxL) maxL.textContent = money(b);
    }
    minR.addEventListener("input", function () { sync("min"); });
    maxR.addEventListener("input", function () { sync("max"); });
    minR.addEventListener("change", function () { box.submit(); });
    maxR.addEventListener("change", function () { box.submit(); });
    if (minN) minN.addEventListener("input", function () { minR.value = minN.value || minR.min; sync("min"); });
    if (maxN) maxN.addEventListener("input", function () { maxR.value = maxN.value || maxR.max; sync("max"); });
  });
  paintCompare();
})();
