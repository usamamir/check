/* Partial SKU search. Shopify matches a whole SKU token (25454rw) and misses the shared number (25454). */
(function () {
  var MAX_PAGE = 48;
  var MAX_SUGGEST = 8;
  var suggestStamp = 0;

  function norm(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function money(cents) {
    var format = (window.Jettribe && Jettribe.moneyFormat) || "${{amount}}";
    var amount = (Number(cents) / 100).toFixed(2);
    return String(format)
      .replace(/\{\{\s*amount\s*\}\}/, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, String(Math.round(cents / 100)))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, amount.replace(".", ","))
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, String(Math.round(cents / 100)));
  }
  function root() {
    var base = (window.Jettribe && Jettribe.routes && Jettribe.routes.root) || "/";
    return base.slice(-1) === "/" ? base : base + "/";
  }
  function loadIndex() {
    if (!window.Jettribe || !Jettribe.skuIndexUrl) return Promise.resolve([]);
    if (!loadIndex.promise) {
      loadIndex.promise = fetch(Jettribe.skuIndexUrl, { headers: { Accept: "application/json" } })
        .then(function (res) { return res.ok ? res.json() : []; })
        .catch(function () { return []; });
    }
    return loadIndex.promise;
  }
  function matchHandles(term) {
    var query = norm(term);
    if (query.length < 4) return Promise.resolve([]);
    return loadIndex().then(function (rows) {
      var handles = [];
      (rows || []).forEach(function (row) {
        if (!row || !row[0] || !row[1]) return;
        if (row[1].indexOf(query) !== -1) handles.push(row[0]);
      });
      handles.sort();
      return handles;
    });
  }
  function blocked(prod) {
    var title = String(prod.title || "").toLowerCase();
    var handle = String(prod.handle || "").toLowerCase();
    if (/promo card|promotional|gift card|gift certificate|restrictions apply/.test(title)) return true;
    if (/promo-card|promotional|gift-card|egift|e-gift/.test(handle)) return true;
    return false;
  }
  function imageOf(prod) {
    var featured = prod.featured_image;
    if (typeof featured === "string" && featured) return featured;
    if (featured && featured.src) return featured.src;
    var img = prod.images && prod.images[0];
    if (!img) return "";
    return typeof img === "string" ? img : (img.src || "");
  }
  function displayPrice(prod) {
    var variants = prod.variants || [];
    var available = variants.filter(function (variant) {
      return variant.available && Number(variant.price) > 0;
    });
    var priced = variants.filter(function (variant) { return Number(variant.price) > 0; });
    var pool = available.length ? available : priced;
    if (!pool.length) {
      var fallback = Number(prod.price) || 0;
      var compare = Number(prod.compare_at_price) || 0;
      if (fallback <= 0 && compare > 0) return { price: compare, compare: 0 };
      return { price: fallback, compare: compare > fallback ? compare : 0 };
    }
    pool.sort(function (a, b) { return Number(a.price) - Number(b.price); });
    var price = Number(pool[0].price);
    var compare = pool.reduce(function (max, variant) {
      return Math.max(max, Number(variant.compare_at_price) || 0);
    }, 0);
    if (compare <= price) compare = 0;
    return { price: price, compare: compare };
  }
  function fetchProduct(handle) {
    return fetch(root() + "products/" + encodeURIComponent(handle) + ".js", { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("missing");
        return res.json();
      })
      .then(function (prod) {
        if (!prod || blocked(prod) || !imageOf(prod)) return null;
        return prod;
      })
      .catch(function () { return null; });
  }
  function cardHtml(prod) {
    var price = displayPrice(prod);
    var img = imageOf(prod);
    var url = root() + "products/" + prod.handle;
    var onlyDefault = !prod.options || !prod.options.length || (prod.options.length === 1 && String(prod.options[0].name || prod.options[0]).toLowerCase() === "title");
    var variant = (prod.variants || []).filter(function (item) { return item.available; })[0] || (prod.variants || [])[0] || {};
    var priceHtml = price.compare > price.price
      ? "<s>" + money(price.compare) + "</s> <span>Now: " + money(price.price) + "</span>"
      : "<span>Now: " + money(price.price) + "</span>";
    var action = prod.available === false
      ? '<span class="btn is-disabled">Out of Stock</span>'
      : (onlyDefault && variant.id
        ? '<button type="button" class="btn" data-add-variant="' + esc(variant.id) + '">Add to Cart</button>'
        : '<a class="btn" href="' + esc(url) + '">Choose Options</a>');
    var quick = prod.available === false
      ? ""
      : '<div class="card-hover"><button type="button" class="btn btn--blue" data-quick-view="' + esc(prod.handle) + '">Quick view</button></div>';
    return '<article class="card" data-sku-match="' + esc(prod.handle) + '">' +
      '<a class="card-media" href="' + esc(url) + '"><img src="' + esc(img) + '" alt="' + esc(prod.title) + '" width="500" height="659" loading="lazy"></a>' +
      quick +
      '<div class="card-body"><h3 class="card-title"><a href="' + esc(url) + '">' + esc(prod.title) + "</a></h3>" +
      '<div class="price">' + priceHtml + "</div>" +
      '<label class="compare-check"><input type="checkbox" data-compare-add data-id="' + esc(prod.id) + '" data-title="' + esc(prod.title) + '" data-price="' + esc(price.price) + '" data-img="' + esc(img) + '" data-url="' + esc(url) + '"><span>Compare</span></label>' +
      '<div class="card-actions">' + action + "</div></div></article>";
  }
  function suggestHtml(prod) {
    var price = displayPrice(prod);
    var img = imageOf(prod);
    var url = root() + "products/" + prod.handle;
    return '<a href="' + esc(url) + '" data-sku-match="' + esc(prod.handle) + '">' +
      '<img src="' + esc(img) + '" alt="' + esc(prod.title) + '" width="54" height="54">' +
      "<span>" + esc(prod.title) + "</span><span>" + money(price.price) + "</span></a>";
  }
  function knownHandles(rootEl) {
    var found = {};
    if (!rootEl) return found;
    rootEl.querySelectorAll("a[href*='/products/']").forEach(function (link) {
      var match = String(link.getAttribute("href") || "").match(/\/products\/([^/?#]+)/);
      if (match) found[decodeURIComponent(match[1])] = true;
    });
    return found;
  }
  function fillPage() {
    var mount = document.querySelector("[data-sku-search]");
    if (!mount) return;
    var term = mount.getAttribute("data-sku-term") || "";
    if (norm(term).length < 4) return;
    matchHandles(term).then(function (handles) {
      if (!handles.length) return;
      var grid = mount.querySelector(".product-grid");
      if (!grid) return;
      var have = knownHandles(grid);
      var pending = handles.filter(function (handle) { return !have[handle]; }).slice(0, MAX_PAGE);
      if (!pending.length) return;
      return Promise.all(pending.map(fetchProduct)).then(function (products) {
        var cards = products.filter(Boolean);
        cards.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
        if (!cards.length) return;
        var empty = grid.querySelector(".empty-products");
        if (empty) empty.remove();
        grid.insertAdjacentHTML("beforeend", cards.map(cardHtml).join(""));
        var count = grid.querySelectorAll("article.card").length;
        var label = mount.querySelector("[data-result-count]");
        if (label) {
          var more = handles.length > cards.length + Object.keys(have).length
            ? " Showing " + count + " of " + handles.length + "."
            : "";
          label.textContent = count + " results for “" + term + "”" + more;
        }
      });
    }).catch(function () {});
  }
  function fillPredictive(box, term) {
    if (!box) return;
    var mine = ++suggestStamp;
    var query = norm(term);
    if (query.length < 4) return;
    matchHandles(term).then(function (handles) {
      if (mine !== suggestStamp || !handles.length) return;
      var have = knownHandles(box);
      var pending = handles.filter(function (handle) { return !have[handle]; }).slice(0, MAX_SUGGEST);
      if (!pending.length) return;
      return Promise.all(pending.map(fetchProduct)).then(function (products) {
        if (mine !== suggestStamp) return;
        var html = products.filter(Boolean).map(suggestHtml).join("");
        if (!html) return;
        var viewAll = box.querySelector(".view-all");
        if (!viewAll) {
          var search = (window.Jettribe && Jettribe.routes && Jettribe.routes.search) || "/search";
          html += '<a class="view-all" href="' + esc(search) + "?q=" + encodeURIComponent(term) + '&type=product">View all results</a>';
          box.insertAdjacentHTML("beforeend", html);
        } else {
          viewAll.insertAdjacentHTML("beforebegin", html);
        }
        box.hidden = !box.innerHTML.trim();
      });
    }).catch(function () {});
  }

  window.JettribeSku = { fillPredictive: fillPredictive };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fillPage);
  else fillPage();
})();
