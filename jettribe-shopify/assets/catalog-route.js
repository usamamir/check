(function () {
  var ALIAS = {
    "swimwear-dresses": "swimwear",
    "custom-gear": "customized-gear-factory",
    "vp-fuels-containers": "vp-racing-containers"
  };
  var COLORS = [
    ["Black", "#161616", /\bblack\b/i],
    ["Blue", "#1d4ed8", /\bblue\b/i],
    ["Red", "#e53d42", /\bred\b/i],
    ["Teal", "#0f766e", /\bteal\b/i],
    ["Green", "#2f8f4e", /\bgreen\b/i],
    ["Pink", "#e56aa0", /\bpink\b/i],
    ["Grey", "#8a8a8a", /\bgr[ae]y\b/i],
    ["Aqua", "#3ec6d4", /\baqua\b/i],
    ["Orange", "#f97316", /\borange\b/i],
    ["White", "#f7f7f7", /\bwhite\b/i],
    ["Purple", "#7c3aed", /\bpurple\b/i],
    ["Yellow", "#eab308", /\byellow\b/i],
    ["Navy", "#1e3a8a", /\bnavy\b/i]
  ];

  function qs(sel, root) { return (root || document).querySelector(sel); }
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
  function searchBase() {
    return (window.Jettribe && Jettribe.routes && Jettribe.routes.search) || "/search";
  }
  function homeHref() {
    return (window.Jettribe && Jettribe.routes && Jettribe.routes.root) || "/";
  }
  function productRoot() {
    var root = (window.Jettribe && Jettribe.routes && Jettribe.routes.root) || "/";
    return root.slice(-1) === "/" ? root : root + "/";
  }
  function titleColors(text) {
    return COLORS.filter(function (row) { return row[2].test(text || ""); }).map(function (row) { return row[0]; });
  }
  function safeHandle(handle) {
    return /^[A-Za-z0-9_-]+$/.test(handle || "");
  }
  function detect() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("jtcat")) return { type: "category", handle: params.get("jtcat") };
    if (params.get("jtpage")) return { type: "page", handle: params.get("jtpage") };
    var path = window.location.pathname;
    var col = path.match(/\/collections\/([^/]+)\/?$/);
    if (col) return { type: "category", handle: decodeURIComponent(col[1]) };
    var page = path.match(/\/pages\/([^/]+)\/?$/);
    if (page) return { type: "page", handle: decodeURIComponent(page[1]) };
    if (/\/blogs\/news(?:\/|$)/.test(path)) return { type: "page", handle: "blog" };
    return null;
  }
  function showPage(mount, handle) {
    if (!safeHandle(handle)) return false;
    var page = qs('[data-jt-page="' + handle + '"]', mount);
    if (!page) return false;
    page.hidden = false;
    document.documentElement.classList.add("jt-routed", "is-jt-ready");
    document.title = (page.getAttribute("data-jt-title") || "Jettribe") + " | Jettribe";
    return true;
  }
  function giveUp() {
    document.documentElement.classList.remove("jt-routed", "is-jt-ready");
  }
  function resolveCategory(data, handle) {
    var cats = data.categories || {};
    if (cats[handle]) return handle;
    var lower = String(handle || "").toLowerCase();
    var found = "";
    Object.keys(cats).some(function (key) {
      if (key.toLowerCase() === lower) {
        found = key;
        return true;
      }
      return false;
    });
    return found;
  }
  function optionName(option) {
    return typeof option === "string" ? option : (option && option.name) || "";
  }
  function cardHtml(opts) {
    var img = opts.img
      ? '<img src="' + esc(opts.img) + '" alt="' + esc(opts.title) + '" width="500" height="659" loading="lazy">'
      : "";
    var priceHtml = opts.compare > opts.price
      ? "<s>" + money(opts.compare) + "</s> <span>Now: " + money(opts.price) + "</span>"
      : "<span>Now: " + money(opts.price) + "</span>";
    var action = !opts.available
      ? '<span class="btn is-disabled">Out of Stock</span>'
      : (opts.variantId && opts.onlyDefault
        ? '<button type="button" class="btn" data-add-variant="' + esc(opts.variantId) + '">Add to Cart</button>'
        : '<a class="btn" href="' + esc(opts.url) + '">Choose Options</a>');
    var quick = opts.available
      ? '<div class="card-hover"><button type="button" class="btn btn--blue" data-quick-view="' + esc(opts.handle) + '">Quick view</button></div>'
      : "";
    return '<article class="card" data-sizes="' + esc((opts.sizes || []).join("|")) + '">' +
      '<a class="card-media" href="' + esc(opts.url) + '">' + img + "</a>" +
      quick +
      '<div class="card-body"><h3 class="card-title"><a href="' + esc(opts.url) + '">' + esc(opts.title) + "</a></h3>" +
      '<div class="price">' + priceHtml + "</div>" +
      '<label class="compare-check"><input type="checkbox" data-compare-add data-id="' + esc(opts.id) + '" data-title="' + esc(opts.title) + '" data-price="' + esc(opts.price) + '" data-img="' + esc(opts.img) + '" data-url="' + esc(opts.url) + '"><span>Compare</span></label>' +
      '<div class="card-actions">' + action + "</div></div></article>";
  }
  function cardFromProduct(prod, meta) {
    var options = prod.options || [];
    var onlyDefault = !options.length || (options.length === 1 && optionName(options[0]).toLowerCase() === "title");
    var sizes = [];
    options.forEach(function (option, index) {
      if (!/size|combo/i.test(optionName(option))) return;
      (prod.variants || []).forEach(function (variant) {
        var value = variant["option" + (index + 1)] || (variant.options || [])[index];
        if (value && sizes.indexOf(value) === -1) sizes.push(value);
      });
    });
    var variant = (prod.variants || []).filter(function (item) { return item.available; })[0] || (prod.variants || [])[0] || {};
    var img = prod.featured_image || "";
    if (img && typeof img === "object") img = img.src || img.url || "";
    return cardHtml({
      id: prod.id || meta.handle,
      handle: prod.handle || meta.handle,
      title: prod.title || meta.title,
      price: prod.price || meta.price || 0,
      compare: prod.compare_at_price || 0,
      img: img,
      url: prod.url || (productRoot() + "products/" + meta.handle),
      available: !!prod.available,
      onlyDefault: onlyDefault,
      variantId: variant.id || "",
      sizes: sizes.length ? sizes : meta.sizes
    });
  }
  function cardFromCatalog(meta) {
    return cardHtml({
      id: meta.handle,
      handle: meta.handle,
      title: meta.title,
      price: meta.price || 0,
      compare: meta.compare || 0,
      img: "",
      url: productRoot() + "products/" + meta.handle,
      available: meta.available !== false,
      onlyDefault: false,
      variantId: "",
      sizes: meta.sizes || []
    });
  }
  function renderCategory(mount, data, handle) {
    var cat = data.categories[handle];
    var params = new URLSearchParams(window.location.search);
    var sort = params.get("sort") || "featured";
    var selectedColors = (params.get("color") || "").split(",").filter(Boolean);
    var selectedSizes = (params.get("size") || "").split(",").filter(Boolean);
    var min = params.get("min") === null || params.get("min") === "" ? null : Number(params.get("min"));
    var max = params.get("max") === null || params.get("max") === "" ? null : Number(params.get("max"));
    var page = Math.max(1, Number(params.get("page") || 1));
    var per = 24;
    var metas = (cat.products || []).map(function (productHandle) {
      var row = (data.products || {})[productHandle] || {};
      return {
        handle: productHandle,
        title: row.title || productHandle,
        price: row.price || 0,
        compare: row.compare || 0,
        sizes: row.sizes || [],
        available: row.available !== false
      };
    });
    function passes(meta, ignore) {
      if (ignore !== "color" && selectedColors.length) {
        var colors = titleColors(meta.title);
        if (!selectedColors.some(function (color) { return colors.indexOf(color) !== -1; })) return false;
      }
      if (ignore !== "size" && selectedSizes.length && !selectedSizes.some(function (size) { return meta.sizes.indexOf(size) !== -1; })) return false;
      if (ignore !== "price" && min != null && !isNaN(min) && meta.price < min * 100) return false;
      if (ignore !== "price" && max != null && !isNaN(max) && meta.price > max * 100) return false;
      return true;
    }
    var filtered = metas.filter(function (meta) { return passes(meta); });
    filtered.sort(function (a, b) {
      if (sort === "alpha") return a.title.localeCompare(b.title);
      if (sort === "alpha-desc") return b.title.localeCompare(a.title);
      if (sort === "priceasc") return a.price - b.price;
      if (sort === "pricedesc") return b.price - a.price;
      return 0;
    });
    var pages = Math.max(1, Math.ceil(filtered.length / per) || 1);
    if (page > pages) page = pages;
    var slice = filtered.slice((page - 1) * per, page * per);
    function href(changes) {
      var state = {
        sort: sort === "featured" ? "" : sort,
        color: selectedColors.join(","),
        size: selectedSizes.join(","),
        min: min != null && !isNaN(min) ? String(min) : "",
        max: max != null && !isNaN(max) ? String(max) : "",
        page: page > 1 ? String(page) : ""
      };
      Object.keys(changes || {}).forEach(function (key) {
        state[key] = changes[key] == null ? "" : String(changes[key]);
      });
      if (!changes || !("page" in changes)) state.page = "";
      var next = new URLSearchParams();
      next.set("jtcat", handle);
      ["sort", "color", "size", "min", "max", "page"].forEach(function (key) {
        if (state[key]) next.set(key, state[key]);
      });
      return searchBase() + "?" + next.toString();
    }
    var chain = [];
    var cursor = cat.parent;
    var seen = {};
    var guard = 0;
    while (cursor && data.categories[cursor] && !seen[cursor] && guard < 6) {
      seen[cursor] = true;
      chain.unshift({ handle: cursor, name: data.categories[cursor].name });
      cursor = data.categories[cursor].parent;
      guard += 1;
    }
    var crumbs = '<a href="' + esc(homeHref()) + '">Home</a>';
    chain.forEach(function (item) {
      crumbs += ' <span>/</span> <a href="' + esc(searchBase() + "?jtcat=" + encodeURIComponent(item.handle)) + '">' + esc(item.name) + "</a>";
    });
    crumbs += " <span>/</span> <span>" + esc(cat.name) + "</span>";
    var colorSet = {};
    var sizeSet = {};
    metas.forEach(function (meta) {
      if (!passes(meta, "color")) return;
      titleColors(meta.title).forEach(function (name) { colorSet[name] = (colorSet[name] || 0) + 1; });
    });
    metas.forEach(function (meta) {
      if (!passes(meta, "size")) return;
      meta.sizes.forEach(function (size) { sizeSet[size] = (sizeSet[size] || 0) + 1; });
    });
    var colorHtml = COLORS.filter(function (row) { return colorSet[row[0]]; }).map(function (row) {
      var nextColors = selectedColors.slice();
      var on = nextColors.indexOf(row[0]) !== -1;
      if (on) nextColors = nextColors.filter(function (item) { return item !== row[0]; });
      else nextColors.push(row[0]);
      return '<a class="swatch' + (on ? " is-active" : "") + '" href="' + esc(href({ color: nextColors.join(",") })) + '" style="--swatch:' + row[1] + '" title="' + esc(row[0]) + " (" + colorSet[row[0]] + ')"><i></i><span>' + esc(row[0]) + "</span></a>";
    }).join("");
    var sizeHtml = Object.keys(sizeSet).map(function (size) {
      var nextSizes = selectedSizes.slice();
      var on = nextSizes.indexOf(size) !== -1;
      if (on) nextSizes = nextSizes.filter(function (item) { return item !== size; });
      else nextSizes.push(size);
      return '<a class="size-chip' + (on ? " is-active" : "") + '" href="' + esc(href({ size: nextSizes.join(",") })) + '">' + esc(size) + "</a>";
    }).join("");
    var childHtml = (cat.children || []).map(function (child) {
      return '<li><a href="' + esc(searchBase() + "?jtcat=" + encodeURIComponent(child.handle)) + '">' + esc(child.name) + "</a></li>";
    }).join("");
    var prices = metas.filter(function (meta) { return passes(meta, "price"); }).map(function (meta) { return meta.price; });
    var floor = prices.length ? Math.floor(Math.min.apply(null, prices) / 100) : 0;
    var ceil = prices.length ? Math.ceil(Math.max.apply(null, prices) / 100) : 0;
    var sortOptions = [
      ["featured", "Featured Items"],
      ["alpha", "A to Z"],
      ["alpha-desc", "Z to A"],
      ["priceasc", "Price: Ascending"],
      ["pricedesc", "Price: Descending"]
    ].map(function (item) {
      return '<option value="' + item[0] + '"' + (sort === item[0] ? " selected" : "") + ">" + item[1] + "</option>";
    }).join("");
    var pager = "";
    if (pages > 1) {
      var links = [];
      for (var i = 1; i <= pages; i += 1) {
        links.push('<a class="' + (i === page ? "is-current" : "") + '" href="' + esc(href({ page: i === 1 ? "" : String(i) })) + '">' + i + "</a>");
      }
      pager = '<nav class="pagination" aria-label="Pages">' + links.join("") + "</nav>";
    }
    var gridHtml = slice.length
      ? '<div class="product-grid" data-jt-grid><p>Loading products…</p></div>' + pager
      : '<div class="empty-products"><p>' + (metas.length ? "No products match these filters." : "No products are listed in this category.") + "</p></div>";
    var root = qs("[data-jt-category-root]", mount);
    root.innerHTML =
      '<nav class="breadcrumbs">' + crumbs + "</nav>" +
      '<h1 class="page-heading" style="justify-content:flex-start;"><span>' + esc(cat.name) + "</span></h1>" +
      '<div class="collection-layout"><aside>' +
      (colorHtml ? '<details class="facet" open><summary>Color</summary><div class="color-swatches">' + colorHtml + "</div></details>" : "") +
      (sizeHtml ? '<details class="facet" open><summary>Size</summary><div class="size-chips">' + sizeHtml + "</div></details>" : "") +
      (childHtml ? '<details class="facet" open><summary>' + esc(cat.name) + "</summary><ul>" + childHtml + "</ul></details>" : "") +
      (prices.length ? '<details class="facet" open><summary>Price</summary><form class="price-range" data-jt-price>' +
        '<div class="field"><label>From</label><input name="min" type="number" min="0" step="1" value="' + esc(params.get("min") || "") + '" placeholder="' + floor + '"></div>' +
        '<div class="field"><label>To</label><input name="max" type="number" min="0" step="1" value="' + esc(params.get("max") || "") + '" placeholder="' + ceil + '"></div>' +
        '<button class="btn" type="submit">Apply</button></form></details>' : "") +
      "</aside><div><div class=\"toolbar\"><p style=\"margin:0;\">" + filtered.length + " products</p>" +
      '<label class="visually-hidden" for="JtSort">Sort</label><select class="select" id="JtSort" data-jt-sort>' + sortOptions + "</select></div>" +
      gridHtml +
      "</div></div>";
    document.title = cat.name + " | Jettribe";
    document.documentElement.classList.add("jt-routed", "is-jt-ready");
    var sortEl = qs("[data-jt-sort]", root);
    if (sortEl) {
      sortEl.addEventListener("change", function () {
        window.location.href = href({ sort: sortEl.value === "featured" ? "" : sortEl.value });
      });
    }
    var priceForm = qs("[data-jt-price]", root);
    if (priceForm) {
      priceForm.addEventListener("submit", function (event) {
        event.preventDefault();
        window.location.href = href({
          min: qs("[name=min]", priceForm).value,
          max: qs("[name=max]", priceForm).value
        });
      });
    }
    if (!slice.length) return;
    Promise.all(slice.map(function (meta) {
      return fetch(productRoot() + "products/" + encodeURIComponent(meta.handle) + ".js", { headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("missing");
          return res.json();
        })
        .then(function (prod) { return cardFromProduct(prod, meta); })
        .catch(function () { return cardFromCatalog(meta); });
    })).then(function (cards) {
      var grid = qs("[data-jt-grid]", root);
      if (grid) grid.innerHTML = cards.join("");
      document.dispatchEvent(new CustomEvent("catalog:rendered"));
    });
  }

  var mount = qs("[data-jt-route]");
  if (!mount) return;
  var route = detect();
  if (!route || !safeHandle(route.handle)) return;
  document.documentElement.classList.add("jt-routed");
  var handle = ALIAS[route.handle] || route.handle;
  if (route.type === "page" && showPage(mount, handle)) return;
  fetch(mount.getAttribute("data-catalog"), { headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("catalog");
      return res.json();
    })
    .then(function (data) {
      var key = resolveCategory(data, handle);
      if (key) {
        renderCategory(mount, data, key);
        return;
      }
      if (!showPage(mount, route.handle)) giveUp();
    })
    .catch(function () {
      if (!showPage(mount, route.handle)) giveUp();
    });
})();
