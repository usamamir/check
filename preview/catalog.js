(function () {
  var listing = document.getElementById("catalog-listing");
  var productMount = document.getElementById("catalog-product");
  var pageMount = document.getElementById("catalog-page");
  var home = document.body.getAttribute("data-page") === "home";
  if (!listing && !productMount && !pageMount && !home) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function money(n) {
    return "$" + Number(n || 0).toFixed(2);
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function params() { return new URLSearchParams(location.search); }

  fetch("catalog.json")
    .then(function (res) { return res.json(); })
    .then(function (data) { boot(data); })
    .catch(function () {
      var el = listing || productMount || pageMount;
      if (el) el.innerHTML = "<p>The product catalog did not load. Refresh this page.</p>";
    });

  function boot(data) {
    var products = data.products || [];
    var categories = data.categories || [];
    var pages = data.pages || [];
    var byProduct = {};
    var byCategory = {};
    var byPage = {};
    products.forEach(function (product) { byProduct[product.handle] = product; });
    categories.forEach(function (category) { byCategory[category.handle] = category; });
    pages.forEach(function (page) { byPage[page.handle] = page; });

    function kids(handle) {
      var seen = {};
      var list = [];
      function add(handleName, name) {
        if (!handleName || seen[handleName] || handleName === handle) return;
        seen[handleName] = true;
        list.push({ handle: handleName, name: name || (byCategory[handleName] && byCategory[handleName].name) || handleName });
      }
      var category = byCategory[handle];
      if (category && category.children) category.children.forEach(function (child) { add(child.handle, child.name); });
      categories.forEach(function (category) {
        if (category.parent === handle) add(category.handle, category.name);
      });
      return list;
    }

    function productsIn(handle, seen) {
      seen = seen || {};
      if (seen[handle]) return [];
      seen[handle] = true;
      var ids = {};
      var category = byCategory[handle];
      if (category && category.products) category.products.forEach(function (id) { ids[id] = true; });
      products.forEach(function (product) {
        if ((product.categories || []).indexOf(handle) !== -1) ids[product.handle] = true;
      });
      var list = products.filter(function (product) { return ids[product.handle]; });
      if (!list.length) {
        kids(handle).forEach(function (child) {
          productsIn(child.handle, seen).forEach(function (product) {
            if (!ids[product.handle]) {
              ids[product.handle] = true;
              list.push(product);
            }
          });
        });
      }
      return list;
    }

    function sizeValues(product) {
      var values = [];
      (product.options || []).forEach(function (option) {
        if (option.type === "select" && /size/i.test(option.name)) values = values.concat(option.values || []);
      });
      return values;
    }

    function card(product) {
      var img = (product.images && product.images[0]) || "";
      var href = "product.html?p=" + encodeURIComponent(product.handle);
      var priced = product.compare && product.compare > product.price
        ? "<s>" + money(product.compare) + "</s> <span>" + money(product.price) + "</span>"
        : "<span>" + money(product.price) + "</span>";
      var stock = product.available ? '<p class="e-stock">In stock</p>' : '<p class="e-stock is-out">Out of stock</p>';
      var action = product.available
        ? ((product.options || []).some(function (option) { return option.type === "select" && option.values && option.values.length; })
          ? '<a class="btn btn--outline" href="' + href + '">Choose options</a>'
          : '<button type="button" class="btn btn--outline" data-add="' + esc(product.handle) + '" data-title="' + esc(product.title) + '" data-price="' + product.price + '" data-img="' + esc(img) + '">Add to cart</button>')
        : '<span class="btn is-disabled">Out of stock</span>';
      var quick = product.available
        ? '<div class="card-hover"><button type="button" class="btn btn--blue" data-quick="' + esc(product.handle) + '" data-title="' + esc(product.title) + '" data-price="' + product.price + '" data-img="' + esc(img) + '" data-url="' + href + '">Quick view</button></div>'
        : "";
      return '<article class="card"><a class="card-media" href="' + href + '"><img src="' + esc(img) + '" alt="' + esc(product.title) + '" width="500" height="659" loading="lazy"></a>' +
        quick +
        '<div class="card-body"><p class="card-vendor">Jettribe</p><h3 class="card-title"><a href="' + href + '">' + esc(product.title) + "</a></h3>" +
        '<div class="price">' + priced + "</div>" + stock + "<div class=\"card-actions\">" + action + "</div></div></article>";
    }

    if (home) {
      var trending = document.getElementById("home-trending");
      var fresh = document.getElementById("home-new");
      var picks = products.filter(function (product) { return product.images && product.images.length && product.price > 20; });
      if (trending) trending.innerHTML = picks.slice(0, 8).map(card).join("");
      if (fresh) fresh.innerHTML = picks.slice(8, 16).map(card).join("");
      document.querySelectorAll(".card-title a").forEach(function (link) {
        var title = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();
        var match = products.filter(function (product) {
          return product.title.toLowerCase() === title || title.indexOf(product.title.toLowerCase()) === 0;
        })[0];
        if (!match) {
          match = products.filter(function (product) {
            return product.title.toLowerCase().indexOf(title.slice(0, 24)) !== -1;
          })[0];
        }
        if (match) {
          var href = "product.html?p=" + encodeURIComponent(match.handle);
          link.href = href;
          var media = link.closest(".card") && link.closest(".card").querySelector(".card-media");
          if (media) media.href = href;
        }
      });
      return;
    }

    if (pageMount) {
      var pageHandle = params().get("page") || "";
      var page = byPage[pageHandle];
      if (!page) {
        pageMount.innerHTML = "<p>This page is not in the Jettribe page list. Open it from the menu.</p>";
        return;
      }
      document.title = page.title + " | Jettribe";
      pageMount.innerHTML = '<nav class="breadcrumbs"><a href="index.html">Home</a> <span>/</span> <span>' + esc(page.title) + "</span></nav>" +
        '<h1 class="page-heading" style="justify-content:flex-start;"><span>' + esc(page.title) + "</span></h1>" +
        '<div class="rte">' + (page.html || "") + "</div>";
      return;
    }

    if (productMount) {
      var handle = params().get("p") || "";
      var product = byProduct[handle];
      if (!product) {
        productMount.innerHTML = '<h1 class="page-heading" style="justify-content:flex-start;"><span>All products</span></h1><div class="product-grid">' +
          products.slice(0, 24).map(card).join("") + '</div><p><a href="collection.html">Browse every listing</a></p>';
        return;
      }
      document.title = product.title + " | Jettribe";
      var crumbs = (product.crumbs || []).filter(function (crumb) { return crumb.handle && crumb.handle !== "www.jettribe.com"; });
      var crumbHtml = '<a href="index.html">Home</a>';
      crumbs.forEach(function (crumb) {
        crumbHtml += ' <span>/</span> <a href="collection.html?cat=' + encodeURIComponent(crumb.handle) + '">' + esc(crumb.name) + "</a>";
      });
      crumbHtml += " <span>/</span> <span>" + esc(product.title) + "</span>";
      var images = product.images && product.images.length ? product.images : [""];
      var thumbs = images.map(function (src, index) {
        return '<button type="button" class="' + (index === 0 ? "is-active" : "") + '" data-thumb data-src="' + esc(src) + '"><img src="' + esc(src) + '" alt="" width="74" height="74"></button>';
      }).join("");
      var optionHtml = (product.options || []).map(function (option) {
        if (option.type === "select") {
          return '<div class="option-label">' + esc(option.name) + '</div><div class="option-values" data-option-group data-option-name="' + esc(option.name) + '">' +
            option.values.map(function (value, index) {
              return '<label class="' + (index === 0 ? "is-selected" : "") + '"><input type="radio" name="opt-' + esc(option.name) + '" value="' + esc(value) + '"' + (index === 0 ? " checked" : "") + "><span>" + esc(value) + "</span></label>";
            }).join("") + "</div>";
        }
        var field = option.type === "file" ? "file" : "text";
        return '<div class="field" style="margin-top:14px;"><label>' + esc(option.name) + '</label><input class="input" type="' + field + '" name="' + esc(option.name) + '" placeholder="' + esc(option.name) + '"></div>';
      }).join("");
      var priceHtml = product.compare && product.compare > product.price
        ? "<s>" + money(product.compare) + "</s> Now: " + money(product.price)
        : "Now: " + money(product.price);
      var button = product.available
        ? '<button class="btn btn--outline" type="submit">Add to cart</button><button class="btn btn--solid" type="submit">Buy it now</button><p class="e-stock">In stock</p>'
        : '<button class="btn" type="button" disabled>Out of stock</button><p class="e-stock is-out">Out of stock</p>';
      var primary = (product.categories && product.categories[0]) || (crumbs[0] && crumbs[0].handle) || "";
      var related = productsIn(primary).filter(function (item) { return item.handle !== product.handle; }).slice(0, 4);
      productMount.innerHTML =
        '<nav class="breadcrumbs">' + crumbHtml + "</nav>" +
        '<div class="product"><div><div class="product-gallery-main"><img data-gallery-main src="' + esc(images[0]) + '" alt="' + esc(product.title) + '" width="1200" height="1200"></div><div class="thumbs">' + thumbs + "</div></div>" +
        '<div class="product-info"><p style="margin-bottom:6px;">Jettribe</p><h1 class="product-title">' + esc(product.title) + "</h1>" +
        '<div class="product-price price">' + priceHtml.replace("Now: ", "") + "</div>" +
        (product.sku ? '<p class="sku">SKU: ' + esc(product.sku) + "</p>" : "") +
        '<form data-product-add data-id="' + esc(product.handle) + '" data-title="' + esc(product.title) + '" data-price="' + product.price + '" data-img="' + esc(images[0]) + '">' +
        optionHtml +
        '<div class="qty-row"><label>Qty</label><input class="input" name="quantity" type="number" min="1" value="1"></div>' +
        '<div class="product-actions">' + button + "</div></form>" +
        '<div class="pay-note"><p>Checkout accepts PayPal, Visa, Mastercard, American Express, and Discover. Shop Pay, Apple Pay, and Google Pay appear when Shopify Payments is on.</p>' +
        '<p>Pay over time with Klarna or <a href="financing.html">Bread financing</a>.</p>' +
        '<div class="payment-row" style="justify-content:flex-start;"><img src="../jettribe-shopify/assets/payment-ic.png" alt="PayPal, Visa, Discover, Mastercard, American Express" width="294" height="32"></div></div></div></div>' +
        '<div class="product-lower"><div class="tabs"><button class="is-active" type="button" data-tab="description">Description</button><button type="button" data-tab="shipping">Shipping</button><button type="button" data-tab="reviews">Reviews</button></div>' +
        '<div class="tab-panel rte is-active" data-tab-panel="description">' + (product.description || "<p>No description was published for this product.</p>") + "</div>" +
        '<div class="tab-panel rte" data-tab-panel="shipping"><p>Free USA shipping on orders of $400 or more. Shipping is calculated at checkout for smaller orders. Rider support: 951.246.3147, Monday through Friday, 9am to 4pm PST.</p></div>' +
        '<div class="tab-panel" data-tab-panel="reviews"><p>Reviews stay with the product record. A Shopify reviews app shows them here after the catalog import.</p></div></div>' +
        (related.length ? '<h2 class="page-heading"><span>You may also like</span></h2><div class="product-grid">' + related.map(card).join("") + "</div>" : "");
      return;
    }

    var query = params();
    var catHandle = query.get("cat") || "";
    var category = byCategory[catHandle];
    var source = catHandle ? productsIn(catHandle) : products.slice();
    var q = (query.get("q") || "").trim().toLowerCase();
    if (q) {
      source = (catHandle ? source : products).filter(function (product) {
        return product.title.toLowerCase().indexOf(q) !== -1 || (product.sku || "").toLowerCase().indexOf(q) !== -1;
      });
    }
    var selectedSizes = (query.get("size") || "").split(",").filter(Boolean);
    var min = query.get("min") ? Number(query.get("min")) : null;
    var max = query.get("max") ? Number(query.get("max")) : null;
    var stock = query.get("stock") === "1";
    var sort = query.get("sort") || "featured";
    var filtered = source.filter(function (product) {
      if (stock && !product.available) return false;
      if (min != null && product.price < min) return false;
      if (max != null && product.price > max) return false;
      if (selectedSizes.length) {
        var sizes = sizeValues(product);
        if (!sizes.length) return false;
        if (!sizes.some(function (size) { return selectedSizes.indexOf(size) !== -1; })) return false;
      }
      return true;
    });
    filtered.sort(function (a, b) {
      if (sort === "priceasc") return a.price - b.price;
      if (sort === "pricedesc") return b.price - a.price;
      if (sort === "alpha") return a.title.localeCompare(b.title);
      if (sort === "alpha-desc") return b.title.localeCompare(a.title);
      return 0;
    });
    var per = 24;
    var pageNum = Math.max(1, Number(query.get("page") || 1));
    var pagesCount = Math.max(1, Math.ceil(filtered.length / per));
    if (pageNum > pagesCount) pageNum = pagesCount;
    var slice = filtered.slice((pageNum - 1) * per, pageNum * per);
    var title = q ? 'Search: ' + query.get("q") : (category ? category.name : "All products");
    document.title = title + " | Jettribe";

    var sizeSet = {};
    source.forEach(function (product) { sizeValues(product).forEach(function (size) { sizeSet[size] = (sizeSet[size] || 0) + 1; }); });
    var sizeNames = Object.keys(sizeSet);
    function linkWith(changes) {
      var next = new URLSearchParams(query.toString());
      Object.keys(changes).forEach(function (key) {
        if (changes[key] == null || changes[key] === "") next.delete(key);
        else next.set(key, changes[key]);
      });
      if (!("page" in changes)) next.delete("page");
      var s = next.toString();
      return "collection.html" + (s ? "?" + s : "");
    }
    var childLinks = catHandle ? kids(catHandle) : categories.filter(function (item) { return !item.parent; }).slice(0, 40);
    var sideName = category ? category.name : "Shop";
    var sizeHtml = sizeNames.map(function (size) {
      var nextSizes = selectedSizes.slice();
      var on = nextSizes.indexOf(size) !== -1;
      if (on) nextSizes = nextSizes.filter(function (item) { return item !== size; });
      else nextSizes.push(size);
      return '<li><a class="' + (on ? "is-active" : "") + '" href="' + linkWith({ size: nextSizes.join(",") }) + '">' + esc(size) + " (" + sizeSet[size] + ")</a></li>";
    }).join("");
    var childHtml = childLinks.map(function (child) {
      return '<li><a href="collection.html?cat=' + encodeURIComponent(child.handle) + '">' + esc(child.name) + "</a></li>";
    }).join("");
    var crumbs = '<a href="index.html">Home</a>';
    if (category) {
      var chain = [];
      var cursor = category;
      var guard = 0;
      while (cursor && cursor.parent && byCategory[cursor.parent] && guard < 6) {
        chain.unshift(byCategory[cursor.parent]);
        cursor = byCategory[cursor.parent];
        guard += 1;
      }
      chain.forEach(function (item) {
        crumbs += ' <span>/</span> <a href="collection.html?cat=' + encodeURIComponent(item.handle) + '">' + esc(item.name) + "</a>";
      });
      crumbs += " <span>/</span> <span>" + esc(category.name) + "</span>";
    } else crumbs += " <span>/</span> <span>" + esc(title) + "</span>";
    var pager = "";
    if (pagesCount > 1) {
      var links = [];
      for (var i = 1; i <= pagesCount; i += 1) {
        links.push('<a class="' + (i === pageNum ? "is-active" : "") + '" href="' + linkWith({ page: i === 1 ? "" : String(i) }) + '">' + i + "</a>");
      }
      pager = '<nav class="pagination" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;">' + links.join("") + "</nav>";
    }
    listing.innerHTML =
      '<nav class="breadcrumbs">' + crumbs + "</nav>" +
      '<h1 class="page-heading" style="justify-content:flex-start;"><span>' + esc(title) + "</span></h1>" +
      '<div class="collection-layout"><aside>' +
      (childHtml ? '<details class="facet" open><summary>' + esc(sideName) + "</summary><ul>" + childHtml + "</ul></details>" : "") +
      (sizeHtml ? '<details class="facet" open><summary>Size</summary><ul>' + sizeHtml + "</ul></details>" : "") +
      '<details class="facet" open><summary>Price</summary><form style="padding:12px;" method="get" action="collection.html">' +
      hidden(query, ["min", "max", "page"]) +
      '<div class="field"><label>From</label><input name="min" type="number" min="0" step="0.01" value="' + esc(query.get("min") || "") + '"></div>' +
      '<div class="field"><label>To</label><input name="max" type="number" min="0" step="0.01" value="' + esc(query.get("max") || "") + '"></div>' +
      '<button class="btn" type="submit">Update</button></form></details>' +
      '<details class="facet" open><summary>Other</summary><ul><li><a class="' + (stock ? "is-active" : "") + '" href="' + linkWith({ stock: stock ? "" : "1" }) + '">In Stock</a></li></ul></details>' +
      "</aside><div><div class=\"toolbar\"><p style=\"margin:0;\">" + filtered.length + " products</p>" +
      '<form method="get" action="collection.html">' + hidden(query, ["sort", "page"]) +
      '<label class="visually-hidden" for="SortBy">Sort</label><select class="select" id="SortBy" name="sort" onchange="this.form.submit()">' +
      option("featured", "Featured Items", sort) +
      option("alpha", "A to Z", sort) +
      option("alpha-desc", "Z to A", sort) +
      option("priceasc", "Price: Ascending", sort) +
      option("pricedesc", "Price: Descending", sort) +
      "</select></form></div>" +
      (slice.length ? '<div class="product-grid">' + slice.map(card).join("") + "</div>" + pager : '<div class="empty-products"><p>No products match these filters.</p></div>') +
      "</div></div>";
  }

  function hidden(query, skip) {
    var html = "";
    query.forEach(function (value, key) {
      if (skip.indexOf(key) !== -1 || !value) return;
      html += '<input type="hidden" name="' + esc(key) + '" value="' + esc(value) + '">';
    });
    return html;
  }
  function option(value, label, current) {
    return '<option value="' + value + '"' + (value === current ? " selected" : "") + ">" + label + "</option>";
  }
})();
