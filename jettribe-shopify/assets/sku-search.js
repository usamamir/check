/* Partial SKU search. Shopify matches a whole SKU token (25454rw) and misses the shared number (25454).
   Spaces and hyphens in a query are optional, so RS25, rs25, RS-25, and RS 25 match the same names. */
(function () {
  var MAX_PAGE = 48;
  var MAX_SUGGEST = 8;
  var suggestStamp = 0;

  function norm(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  function fold(value) {
    return String(value || "").toLowerCase().replace(/[\s\-]+/g, "");
  }
  function modelCode(term) {
    var folded = fold(term);
    return folded.length >= 4 && /^[a-z]+\d/.test(folded);
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
  function loadCatalog() {
    if (!window.Jettribe || !Jettribe.catalogUrl) return Promise.resolve({ titles: {}, categories: {} });
    if (!loadCatalog.promise) {
      loadCatalog.promise = fetch(Jettribe.catalogUrl, { headers: { Accept: "application/json" } })
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (data) {
          var titles = {};
          var products = (data && data.products) || {};
          Object.keys(products).forEach(function (handle) {
            titles[handle] = (products[handle] && products[handle].title) || "";
          });
          return { titles: titles, categories: (data && data.categories) || {} };
        })
        .catch(function () { return { titles: {}, categories: {} }; });
    }
    return loadCatalog.promise;
  }
  function selectedCategory() {
    var dept = document.querySelector("[data-search-dept]");
    if (dept && dept.value) {
      try {
        var chosen = new URL(dept.value, window.location.origin).searchParams.get("jtcat");
        if (chosen) return chosen;
      } catch (err) {}
    }
    return new URLSearchParams(window.location.search).get("jtcat") || "";
  }
  function categoryAllow(catalog, cat) {
    if (!cat || !catalog) return null;
    var row = catalog.categories && catalog.categories[cat];
    var products = row && row.products;
    if (!products || !products.length) return null;
    var allow = {};
    products.forEach(function (handle) { allow[handle] = true; });
    return allow;
  }
  function handleFromLink(link) {
    var match = String(link.getAttribute("href") || "").match(/\/products\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
  function dropOutside(rootEl, allow) {
    if (!allow || !rootEl) return;
    rootEl.querySelectorAll("a[href*='/products/']").forEach(function (link) {
      var handle = handleFromLink(link);
      if (!handle || allow[handle]) return;
      var card = link.closest("article.card");
      if (card) card.remove();
      else if (!link.classList.contains("view-all")) link.remove();
    });
  }
  function matchHandles(term) {
    var query = norm(term);
    var folded = fold(term);
    if (query.length < 4) return Promise.resolve([]);
    return Promise.all([loadIndex(), loadCatalog()]).then(function (loaded) {
      var rows = loaded[0] || [];
      var catalog = loaded[1] || { titles: {}, categories: {} };
      var titles = catalog.titles || {};
      var seen = {};
      var handles = [];
      function add(handle) {
        if (!handle || seen[handle]) return;
        seen[handle] = true;
        handles.push(handle);
      }
      function nameHit(handle, title) {
        if (folded.length < 4) return false;
        return fold(handle).indexOf(folded) !== -1 || fold(title).indexOf(folded) !== -1;
      }
      rows.forEach(function (row) {
        if (!row || !row[0]) return;
        var handle = String(row[0]);
        var skus = String(row[1] || "");
        if ((skus && skus.indexOf(query) !== -1) || nameHit(handle, titles[handle] || "")) add(handle);
      });
      Object.keys(titles).forEach(function (handle) {
        if (nameHit(handle, titles[handle])) add(handle);
      });
      var allow = categoryAllow(catalog, selectedCategory());
      if (allow) handles = handles.filter(function (handle) { return allow[handle]; });
      handles.sort();
      return handles;
    });
  }
  function looseHit(term, text) {
    var folded = fold(term);
    return folded.length >= 4 && fold(text).indexOf(folded) !== -1;
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
  function paintCount(mount, grid, term, matched) {
    var count = grid.querySelectorAll("article.card").length;
    var label = mount.querySelector("[data-result-count]");
    if (!label) return;
    var more = matched > count ? " Showing " + count + " of " + matched + "." : "";
    label.textContent = count + " results for “" + term + "”" + more;
  }
  function dropLooseCards(grid, term) {
    if (!modelCode(term)) return;
    grid.querySelectorAll("article.card").forEach(function (card) {
      if (card.hasAttribute("data-sku-match")) return;
      var link = card.querySelector("a[href*='/products/']");
      var blob = (card.textContent || "") + " " + (link ? link.getAttribute("href") || "" : "");
      if (!looseHit(term, blob)) card.remove();
    });
    var empty = grid.querySelector(".empty-products");
    if (empty && grid.querySelector("article.card")) empty.remove();
  }
  function fillPage() {
    var mount = document.querySelector("[data-sku-search]");
    if (!mount) return;
    var term = mount.getAttribute("data-sku-term") || "";
    if (norm(term).length < 4) return;
    matchHandles(term).then(function (handles) {
      var grid = mount.querySelector(".product-grid");
      if (!grid) return;
      return loadCatalog().then(function (catalog) {
        dropOutside(grid, categoryAllow(catalog, selectedCategory()));
        return handles;
      }).then(function () {
      dropLooseCards(grid, term);
      if (!handles.length) {
        paintCount(mount, grid, term, grid.querySelectorAll("article.card").length);
        return;
      }
      var have = knownHandles(grid);
      var pending = handles.filter(function (handle) { return !have[handle]; }).slice(0, MAX_PAGE);
      if (!pending.length) {
        paintCount(mount, grid, term, handles.length);
        return;
      }
      return Promise.all(pending.map(fetchProduct)).then(function (products) {
        var cards = products.filter(Boolean);
        cards.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
        if (cards.length) {
          var empty = grid.querySelector(".empty-products");
          if (empty) empty.remove();
          grid.insertAdjacentHTML("beforeend", cards.map(cardHtml).join(""));
        } else if (!grid.querySelector("article.card") && !grid.querySelector(".empty-products")) {
          grid.insertAdjacentHTML("beforeend", '<div class="empty-products"><p>No results. Try a product name, vest, wetsuit, or cover.</p></div>');
        }
        paintCount(mount, grid, term, handles.length);
      });
      });
    }).catch(function () {});
  }
  function dropLooseSuggestions(box, term) {
    if (!modelCode(term)) return;
    box.querySelectorAll("a:not(.view-all)").forEach(function (link) {
      if (link.hasAttribute("data-sku-match")) return;
      var blob = (link.textContent || "") + " " + (link.getAttribute("href") || "");
      if (!looseHit(term, blob)) link.remove();
    });
  }
  function limitCategory(box) {
    return loadCatalog().then(function (catalog) {
      dropOutside(box, categoryAllow(catalog, selectedCategory()));
      box.hidden = !box.innerHTML.trim();
    });
  }
  function fillPredictive(box, term) {
    if (!box) return;
    var mine = ++suggestStamp;
    var query = norm(term);
    if (query.length < 4) {
      limitCategory(box);
      return;
    }
    matchHandles(term).then(function (handles) {
      if (mine !== suggestStamp) return;
      return loadCatalog().then(function (catalog) {
        if (mine !== suggestStamp) return handles;
        dropOutside(box, categoryAllow(catalog, selectedCategory()));
        return handles;
      });
    }).then(function (handles) {
      if (mine !== suggestStamp || !handles) return;
      dropLooseSuggestions(box, term);
      box.hidden = !box.innerHTML.trim();
      if (!handles.length) return;
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
          var viewHref = search + "?q=" + encodeURIComponent(term) + "&type=product";
          var dept = document.querySelector("[data-search-dept]");
          if (dept && dept.value) {
            var deptUrl = new URL(dept.value, window.location.origin);
            deptUrl.searchParams.set("q", term);
            viewHref = deptUrl.pathname + deptUrl.search;
          }
          html += '<a class="view-all" href="' + esc(viewHref) + '">View all results</a>';
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
