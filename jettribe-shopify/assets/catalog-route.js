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
    ["Pink", "#e56aa0", /\b(pink|magenta|fuchsia)\b/i],
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
  function canonicalSize(value) {
    return String(value || "").trim().replace(/\s*\/\s*/g, "/");
  }
  function inStockSizes(prod) {
    var sizes = [];
    var options = (prod && prod.options) || [];
    options.forEach(function (option, index) {
      if (!/size|combo/i.test(optionName(option))) return;
      (prod.variants || []).forEach(function (variant) {
        if (!variant.available) return;
        var value = variant["option" + (index + 1)] || (variant.options || [])[index];
        var key = canonicalSize(value);
        if (key && sizes.indexOf(key) === -1) sizes.push(key);
      });
    });
    return sizes;
  }
  function sizeInStock(prod, selected) {
    if (!selected || !selected.length) return true;
    var sizes = inStockSizes(prod);
    return selected.some(function (size) { return sizes.indexOf(canonicalSize(size)) !== -1; });
  }
  function canonicalSizes(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (size) {
      var key = canonicalSize(size);
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });
    return out;
  }
  function safeHandle(handle) {
    return /^[A-Za-z0-9_-]+$/.test(handle || "");
  }
  function normKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function productImage(prod) {
    var img = (prod && prod.featured_image) || "";
    if (img && typeof img === "object") img = img.src || img.url || "";
    if (!img && prod && prod.images && prod.images.length) {
      var first = prod.images[0];
      img = typeof first === "string" ? first : (first.src || first.url || "");
    }
    return img || "";
  }
  function isBlockedProduct(prod, meta) {
    var title = String((prod && prod.title) || (meta && meta.title) || "").toLowerCase();
    var handle = String((prod && prod.handle) || (meta && meta.handle) || "").toLowerCase();
    var blob = title + " " + handle;
    if (/promo(\s|-)?card|promotional|gift[\s-]?card|gift[\s-]?certificate|coupon|restrictions apply|\$\d+\s*promo|e-?gift|egift/.test(blob)) {
      return true;
    }
    return false;
  }
  function showOnSite(prod, meta) {
    if (isBlockedProduct(prod, meta)) return false;
    var img = productImage(prod) || (meta && meta.image) || "";
    if (!img) return false;
    if (prod && prod.available === false) return false;
    if (meta && meta.available === false) return false;
    return !!(prod && prod.handle) || !!(meta && meta.handle);
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
    if (!showOnSite(prod, meta)) return "";
    var options = prod.options || [];
    var onlyDefault = !options.length || (options.length === 1 && optionName(options[0]).toLowerCase() === "title");
    var sizes = inStockSizes(prod);
    if (!sizes.length) sizes = canonicalSizes(meta && meta.sizes);
    var variant = (prod.variants || []).filter(function (item) { return item.available; })[0] || (prod.variants || [])[0] || {};
    var img = productImage(prod) || (meta && meta.image) || "";
    return cardHtml({
      id: prod.id || meta.handle,
      handle: prod.handle || meta.handle,
      title: prod.title || meta.title,
      price: prod.price || meta.price || 0,
      compare: prod.compare_at_price || meta.compare || 0,
      img: img,
      url: prod.url || (productRoot() + "products/" + meta.handle),
      available: prod.available !== false,
      onlyDefault: onlyDefault,
      variantId: variant.id || "",
      sizes: sizes
    });
  }
  function cardFromCatalog(meta) {
    if (!showOnSite(null, meta)) return "";
    return cardHtml({
      id: meta.handle,
      handle: meta.handle,
      title: meta.title,
      price: meta.price || 0,
      compare: meta.compare || 0,
      img: meta.image || "",
      url: productRoot() + "products/" + meta.handle,
      available: meta.available !== false,
      onlyDefault: false,
      variantId: "",
      sizes: canonicalSizes(meta.sizes)
    });
  }
  function dollarsToCents(value) {
    var n = Number(value);
    return isFinite(n) ? Math.round(n * 100) : 0;
  }
  function asStoreProduct(prod) {
    var variants = (prod.variants || []).map(function (variant) {
      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        available: !!variant.available,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        options: [variant.option1, variant.option2, variant.option3].filter(function (value) { return value != null && value !== ""; }),
        price: dollarsToCents(variant.price),
        compare_at_price: variant.compare_at_price ? dollarsToCents(variant.compare_at_price) : 0
      };
    });
    var first = variants[0] || {};
    var image = prod.images && prod.images[0];
    return {
      id: prod.id,
      handle: prod.handle,
      title: prod.title,
      options: prod.options || [],
      variants: variants,
      price: first.price || 0,
      compare_at_price: first.compare_at_price || 0,
      featured_image: (image && (image.src || image)) || "",
      available: variants.some(function (variant) { return variant.available; }),
      tags: prod.tags || [],
      type: prod.product_type || prod.type || "",
      url: productRoot() + "products/" + prod.handle
    };
  }
  function metaFromLive(prod) {
    var store = asStoreProduct(prod);
    var sizes = inStockSizes(store);
    return {
      handle: store.handle,
      title: store.title,
      price: store.price,
      compare: store.compare_at_price || 0,
      sizes: sizes,
      available: store.available,
      image: productImage(store),
      live: store
    };
  }
  function loadCollection(handle) {
    var key = String(handle || "").toLowerCase();
    function page(n) {
      return fetch(productRoot() + "collections/" + encodeURIComponent(key) + "/products.json?limit=250&page=" + n, { headers: { Accept: "application/json" } })
        .then(function (res) {
          var type = (res.headers.get("content-type") || "").toLowerCase();
          if (res.status === 404) return { missing: true };
          if (!res.ok || type.indexOf("json") === -1 || !res.json) return { missing: true };
          return res.json().then(function (body) {
            return { products: (body && body.products) || [] };
          });
        });
    }
    function collect(n, acc) {
      return page(n).then(function (result) {
        if (!result || result.missing) return n === 1 ? null : acc;
        var next = acc.concat(result.products);
        if (result.products.length === 250 && n < 4) return collect(n + 1, next);
        return next;
      });
    }
    return collect(1, []).catch(function () { return null; });
  }
  function tagList(prod) {
    var tags = (prod && prod.tags) || [];
    if (!Array.isArray(tags)) tags = String(tags).split(",");
    return tags.map(function (tag) { return String(tag).trim().toLowerCase(); }).filter(Boolean);
  }
  function categoryKeys(data) {
    var map = {};
    var cats = (data && data.categories) || {};
    Object.keys(cats).forEach(function (key) {
      map[normKey(key)] = key;
      var name = cats[key] && cats[key].name;
      if (name && !map[normKey(name)]) map[normKey(name)] = key;
    });
    return map;
  }
  function placements(prod, map) {
    var found = [];
    function add(raw) {
      var key = map[normKey(raw)];
      if (key && found.indexOf(key) === -1) found.push(key);
    }
    tagList(prod).forEach(function (tag) {
      add(tag.indexOf("collection:") === 0 ? tag.slice(11) : tag);
    });
    add(prod.type || prod.product_type || "");
    return found;
  }
  function hasMenuTag(prod, handle, map) {
    return placements(prod, map).indexOf(handle) !== -1;
  }
  function loadTagged(handle, name) {
    var key = String(handle || "").toLowerCase();
    if (!safeHandle(key)) return Promise.resolve(null);
    var words = [key];
    if (name) words.push(name);
    var spaced = key.replace(/-/g, " ");
    if (words.indexOf(spaced) === -1) words.push(spaced);
    var parts = [];
    words.forEach(function (word) {
      var safe = String(word).replace(/"/g, "");
      parts.push('tag:"collection:' + safe + '"');
      parts.push('tag:"' + safe + '"');
      parts.push('product_type:"' + safe + '"');
    });
    var q = parts.join(" OR ");
    function page(n) {
      return fetch(searchBase() + "?view=jtmenu&type=product&q=" + encodeURIComponent(q) + "&page=" + n, { headers: { Accept: "application/json" } })
        .then(function (res) {
          var type = (res.headers.get("content-type") || "").toLowerCase();
          if (!res.ok || type.indexOf("json") === -1) return { missing: true };
          return res.json().then(function (body) {
            return { products: (body && body.products) || [], pages: (body && body.pages) || 1 };
          });
        });
    }
    function collect(n, acc) {
      return page(n).then(function (result) {
        if (!result || result.missing) return n === 1 ? null : acc;
        var next = acc.concat(result.products);
        if (n < (result.pages || 1) && n < 8) return collect(n + 1, next);
        return next;
      });
    }
    return collect(1, []).catch(function () { return null; });
  }
  function renderCategory(mount, data, handle, live, tagged) {
    var cat = data.categories[handle];
    var params = new URLSearchParams(window.location.search);
    var sort = params.get("sort") || "featured";
    var selectedColors = (params.get("color") || "").split(",").filter(Boolean);
    var selectedSizes = canonicalSizes((params.get("size") || "").split(","));
    var min = params.get("min") === null || params.get("min") === "" ? null : Number(params.get("min"));
    var max = params.get("max") === null || params.get("max") === "" ? null : Number(params.get("max"));
    var page = 1;
    var per = 10000;
    var metas = [];
    var seenHandles = {};
    var handleKey = String(handle || "").toLowerCase();
    var keys = categoryKeys(data);
    function addLive(prod) {
      var meta = metaFromLive(prod);
      if (!meta.handle || seenHandles[meta.handle] || !showOnSite(meta.live, meta)) return;
      seenHandles[meta.handle] = true;
      meta.locked = true;
      metas.push(meta);
    }
    (live || []).forEach(addLive);
    (tagged || []).forEach(function (prod) {
      if (hasMenuTag(prod, handle, keys)) addLive(prod);
    });
    (cat.products || []).forEach(function (productHandle) {
      if (seenHandles[productHandle]) return;
      var row = (data.products || {})[productHandle] || {};
      var saved = {
        handle: productHandle,
        title: row.title || productHandle,
        price: row.price || 0,
        compare: row.compare || 0,
        sizes: canonicalSizes(row.sizes),
        available: row.available !== false,
        image: row.image || "",
        saved: true
      };
      if (!showOnSite(null, saved)) return;
      seenHandles[productHandle] = true;
      metas.push(saved);
    });
    function passes(meta, ignore) {
      if (ignore !== "color" && selectedColors.length) {
        var colors = titleColors(meta.title);
        if (!selectedColors.some(function (color) { return colors.indexOf(color) !== -1; })) return false;
      }
      if (ignore !== "size" && selectedSizes.length && !selectedSizes.some(function (size) { return meta.sizes.indexOf(canonicalSize(size)) !== -1; })) return false;
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
    function href(changes, nextHandle) {
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
      next.set("jtcat", nextHandle || handle);
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
      crumbs += ' <span>/</span> <a href="' + esc(href({}, item.handle)) + '">' + esc(item.name) + "</a>";
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
    var sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL", "XXXL", "XXXXL", "XXS/XS", "XS/S", "S/M", "M/L", "L/XL", "XL/XXL", "XXL/XXXL", "XXL/XXXXL", "2XL/3XL"];
    var sizeHtml = Object.keys(sizeSet).sort(function (a, b) {
      var ia = sizeOrder.indexOf(canonicalSize(a).toUpperCase());
      var ib = sizeOrder.indexOf(canonicalSize(b).toUpperCase());
      if (ia === -1) ia = 500;
      if (ib === -1) ib = 500;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    }).map(function (size) {
      var nextSizes = selectedSizes.slice();
      var on = nextSizes.indexOf(size) !== -1;
      if (on) nextSizes = nextSizes.filter(function (item) { return item !== size; });
      else nextSizes.push(size);
      return '<a class="size-chip' + (on ? " is-active" : "") + '" href="' + esc(href({ size: nextSizes.join(",") })) + '">' + esc(size) + "</a>";
    }).join("");
    var childHtml = (cat.children || []).map(function (child) {
      return '<li><a href="' + esc(href({}, child.handle)) + '">' + esc(child.name) + "</a></li>";
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
    var gridHtml = slice.length
      ? '<div class="product-grid" data-jt-grid>' + slice.map(function (meta) { return cardFromCatalog(meta); }).join("") + "</div>"
      : '<div class="empty-products"><p>' + (metas.length ? "No products match these filters." : "No products are listed in this category.") + "</p></div>";
    var root = qs("[data-jt-category-root]", mount);
    root.innerHTML =
      '<nav class="breadcrumbs">' + crumbs + "</nav>" +
      '<h1 class="page-heading" style="justify-content:flex-start;"><span>' + esc(cat.name) + "</span></h1>" +
      '<div class="collection-layout"><aside>' +
      (childHtml ? '<details class="facet" open><summary>' + esc(cat.name) + "</summary><ul>" + childHtml + "</ul></details>" : "") +
      (sizeHtml ? '<details class="facet" open><summary>Size</summary><div class="size-chips">' + sizeHtml + "</div></details>" : "") +
      (colorHtml ? '<details class="facet" open><summary>Color</summary><div class="color-swatches">' + colorHtml + "</div></details>" : "") +
      (prices.length ? '<details class="facet" open><summary>Price</summary><form class="price-range" data-jt-price method="get" action="' + esc(searchBase()) + '">' +
        '<input type="hidden" name="jtcat" value="' + esc(handle) + '">' +
        (selectedColors.length ? '<input type="hidden" name="color" value="' + esc(selectedColors.join(",")) + '">' : "") +
        (selectedSizes.length ? '<input type="hidden" name="size" value="' + esc(selectedSizes.join(",")) + '">' : "") +
        (sort !== "featured" ? '<input type="hidden" name="sort" value="' + esc(sort) + '">' : "") +
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
    function belongs(prod, meta) {
      if (meta.saved || meta.locked) return true;
      var places = placements(prod, keys);
      if (places.length) return places.indexOf(handle) !== -1;
      return true;
    }
    Promise.all(slice.map(function (meta) {
      if (meta.live) {
        if (selectedSizes.length && !sizeInStock(meta.live, selectedSizes)) return cardFromCatalog(meta);
        return belongs(meta.live, meta) ? cardFromProduct(meta.live, meta) : cardFromCatalog(meta);
      }
      return fetch(productRoot() + "products/" + encodeURIComponent(meta.handle) + ".js", { headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("missing");
          return res.json();
        })
        .then(function (prod) {
          if (selectedSizes.length && !sizeInStock(prod, selectedSizes)) return cardFromCatalog(meta);
          return belongs(prod, meta) ? cardFromProduct(prod, meta) : cardFromCatalog(meta);
        })
        .catch(function () { return cardFromCatalog(meta); });
    })).then(function (cards) {
      var kept = cards.filter(Boolean);
      var grid = qs("[data-jt-grid]", root);
      if (grid && kept.length) grid.innerHTML = kept.join("");
      var count = qs(".toolbar p", root);
      if (count) count.textContent = kept.length + " products";
      document.dispatchEvent(new CustomEvent("catalog:rendered"));
    });
  }

  function renderBlog(mount) {
    var box = qs("[data-jt-blog]", mount);
    if (!box) return;
    var heading = qs("[data-jt-blog-heading]", mount);
    var postHandle = new URLSearchParams(window.location.search).get("jtpost");
    fetch(box.getAttribute("data-blog"), { headers: { Accept: "application/json" } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var posts = data.posts || [];
        if (postHandle) {
          var post = null;
          posts.some(function (item) {
            if (item.handle === postHandle) { post = item; return true; }
            return false;
          });
          if (heading) heading.hidden = true;
          if (!post) {
            box.innerHTML = "<p>This post is not available.</p>";
            return;
          }
          document.title = post.title + " | Jettribe";
          box.innerHTML =
            '<p><a href="' + esc(searchBase() + "?jtpage=blog") + '">Blog</a></p>' +
            '<h1 class="page-heading" style="justify-content:flex-start;"><span>' + esc(post.title) + "</span></h1>" +
            (post.date ? "<p>" + esc(post.date) + "</p>" : "") +
            (post.image ? '<p class="article-hero"><img src="' + esc(post.image) + '" alt="' + esc(post.title) + '"></p>' : "") +
            '<div class="rte">' + (post.html || "") + "</div>";
          return;
        }
        if (heading) heading.hidden = false;
        box.innerHTML = '<div class="blog-list">' + posts.map(function (post) {
          var href = searchBase() + "?jtpage=blog&jtpost=" + encodeURIComponent(post.handle);
          return '<article class="blog-card"><a href="' + esc(href) + '">' +
            (post.image ? '<img src="' + esc(post.image) + '" alt="' + esc(post.title) + '">' : "") +
            '</a><div><h2><a href="' + esc(href) + '">' + esc(post.title) + "</a></h2>" +
            (post.date ? "<p>" + esc(post.date) + "</p>" : "") +
            '<div class="rte">' + esc(post.excerpt || "") + '</div><a href="' + esc(href) + '">Read</a></div></article>';
        }).join("") + "</div>";
      })
      .catch(function () {
        box.innerHTML = "<p>The blog could not be loaded.</p>";
      });
  }
  function loadStoreCollections() {
    function page(n) {
      return fetch(productRoot() + "collections.json?limit=250&page=" + n, { headers: { Accept: "application/json" } })
        .then(function (res) {
          var type = (res.headers.get("content-type") || "").toLowerCase();
          if (!res.ok || type.indexOf("json") === -1) return [];
          return res.json().then(function (body) { return (body && body.collections) || []; });
        })
        .catch(function () { return []; });
    }
    return page(1).then(function (first) {
      if (!first || first.length < 250) return first || [];
      return page(2).then(function (second) { return first.concat(second || []); });
    });
  }
  function loadCategoryLists(data, key) {
    var cat = (data.categories && data.categories[key]) || {};
    var wanted = {};
    wanted[normKey(key)] = true;
    if (cat.name) wanted[normKey(cat.name)] = true;
    return loadStoreCollections().then(function (cols) {
      var handles = [];
      (cols || []).forEach(function (col) {
        if ((wanted[normKey(col.handle)] || wanted[normKey(col.title)]) && handles.indexOf(col.handle) === -1) {
          handles.push(col.handle);
        }
      });
      if (!handles.length) handles.push(key);
      return Promise.all(handles.map(loadCollection)).then(function (lists) {
        var live = [];
        lists.forEach(function (list) {
          if (list) live = live.concat(list);
        });
        return loadTagged(key, cat.name).then(function (tagged) {
          return [live, tagged];
        });
      });
    });
  }
  var mount = qs("[data-jt-route]");
  if (!mount) return;
  var route = detect();
  if (!route || !safeHandle(route.handle)) return;
  document.documentElement.classList.add("jt-routed");
  var handle = ALIAS[route.handle] || route.handle;
  if (route.type === "page" && showPage(mount, handle)) {
    if (handle === "blog") renderBlog(mount);
    return;
  }
  fetch(mount.getAttribute("data-catalog"), { headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("catalog");
      return res.json();
    })
    .then(function (data) {
      var key = resolveCategory(data, handle);
      if (key) {
        loadCategoryLists(data, key).then(function (lists) {
          renderCategory(mount, data, key, lists[0], lists[1]);
        });
        return;
      }
      if (!showPage(mount, route.handle)) giveUp();
    })
    .catch(function () {
      if (!showPage(mount, route.handle)) giveUp();
    });
})();
