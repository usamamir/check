(function () {
  var moneyFormat = (window.Jettribe && window.Jettribe.moneyFormat) || "${{amount}}";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return String(moneyFormat)
      .replace(/\{\{\s*amount\s*\}\}/, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, String(Math.round(cents / 100)))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, amount.replace(".", ","))
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, String(Math.round(cents / 100)));
  }

  function fetchJSON(url, options) {
    return fetch(url, options).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var message = (data && (data.description || data.message)) || "Something went wrong.";
          throw new Error(message);
        }
        return data;
      });
    });
  }

  function setCartCount(count) {
    qsa("[data-cart-count]").forEach(function (el) { el.textContent = count; });
  }

  var swatchColors = [
    ["black", "#161616"],
    ["navy", "#1e3a8a"],
    ["blue", "#1d4ed8"],
    ["teal", "#0f766e"],
    ["aqua", "#3ec6d4"],
    ["green", "#2f8f4e"],
    ["pink", "#e56aa0"],
    ["magenta", "#e56aa0"],
    ["fuchsia", "#e56aa0"],
    ["grey", "#8a8a8a"],
    ["gray", "#8a8a8a"],
    ["orange", "#f97316"],
    ["purple", "#7c3aed"],
    ["yellow", "#eab308"],
    ["white", "#f7f7f7"],
    ["red", "#e53d42"]
  ];
  function swatchBackground(label) {
    var key = String(label || "").toLowerCase();
    var hits = [];
    swatchColors.forEach(function (row) {
      if (key.indexOf(row[0]) !== -1 && hits.indexOf(row[1]) === -1) hits.push(row[1]);
    });
    if (!hits.length) return "#c8c8c8";
    if (hits.length === 1) return hits[0];
    return "linear-gradient(135deg, " + hits[0] + " 50%, " + hits[1] + " 50%)";
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /* Mobile nav */
  var menuToggle = qs("[data-menu-toggle]");
  var siteNav = qs("[data-site-nav]");
  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    qsa(".nav-item.has-sub > a", siteNav).forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (window.matchMedia("(max-width: 991px)").matches) {
          event.preventDefault();
          link.parentElement.classList.toggle("is-open");
        }
      });
    });
  }

  /* Keep a menu panel open while the pointer travels into it. */
  function bindMenuIntent(nav) {
    if (!nav) return;
    var timer = null;
    qsa(".nav-list > .nav-item", nav).forEach(function (item) {
      item.addEventListener("mouseenter", function () {
        if (window.matchMedia("(max-width: 991px)").matches) return;
        clearTimeout(timer);
        qsa(".nav-list > .nav-item.is-mega", nav).forEach(function (other) {
          if (other !== item) other.classList.remove("is-mega");
        });
        item.classList.add("is-mega");
      });
      item.addEventListener("mouseleave", function () {
        if (window.matchMedia("(max-width: 991px)").matches) return;
        timer = setTimeout(function () { item.classList.remove("is-mega"); }, 320);
      });
    });
  }
  bindMenuIntent(siteNav);

  qsa(".search-form--split").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var dept = qs("[data-search-dept]", form);
      var field = qs("input[name='q']", form);
      if (!dept || !dept.value) return;
      if (field && field.value.trim()) return;
      event.preventDefault();
      window.location.href = dept.value;
    });
  });

  /* Sliders */
  function setupSlider(root) {
    if (!root) return;
    var slides = qsa("[data-slide]", root);
    if (!slides.length) return;
    var dotsWrap = qs("[data-dots]", root);
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === index); });
      if (dotsWrap) {
        qsa("button", dotsWrap).forEach(function (dot, i) { dot.classList.toggle("is-active", i === index); });
      }
    }

    slides.forEach(function (_, i) {
      if (!dotsWrap) return;
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Slide " + (i + 1));
      dot.addEventListener("click", function () { show(i); restart(); });
      dotsWrap.appendChild(dot);
    });

    var prev = qs("[data-prev]", root);
    var next = qs("[data-next]", root);
    if (prev) prev.addEventListener("click", function () { show(index - 1); restart(); });
    if (next) next.addEventListener("click", function () { show(index + 1); restart(); });

    function restart() {
      if (!root.hasAttribute("data-autoplay")) return;
      clearInterval(timer);
      timer = setInterval(function () { show(index + 1); }, 4000);
    }
    show(0);
    restart();
  }
  qsa("[data-slider]").forEach(setupSlider);

  /* Predictive search */
  qsa("[data-predictive]").forEach(function (input) {
    var form = input.closest("form");
    var box = qs("[data-predictive-results]", form);
    var timer;
    if (!box) return;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var term = input.value.trim();
      if (term.length < 2) { box.hidden = true; box.innerHTML = ""; return; }
      timer = setTimeout(function () {
        var url = "/search/suggest?q=" + encodeURIComponent(term) +
          "&section_id=predictive-search&resources[type]=product,page,article&resources[limit]=6";
        fetch(url).then(function (res) { return res.text(); }).then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var inner = doc.querySelector(".predictive") || doc.body;
          box.innerHTML = inner.innerHTML;
          box.hidden = !box.innerHTML.trim();
        }).catch(function () { box.hidden = true; });
      }, 220);
    });
    document.addEventListener("click", function (event) {
      if (!form.contains(event.target)) box.hidden = true;
    });
  });

  /* Cart drawer */
  var cartDrawer = qs("[data-cart-drawer]");
  var cartBackdrop = qs("[data-cart-backdrop]");

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.hidden = false;
    if (cartBackdrop) cartBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.hidden = true;
    if (cartBackdrop) cartBackdrop.hidden = true;
    if (!(siteNav && siteNav.classList.contains("is-open"))) document.body.style.overflow = "";
  }
  qsa("[data-open-cart]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      if (window.Jettribe && window.Jettribe.cartType === "page") return;
      event.preventDefault();
      renderCart().then(openCart);
    });
  });
  qsa("[data-close-cart]").forEach(function (el) { el.addEventListener("click", closeCart); });

  function renderCart() {
    return fetchJSON("/cart.js").then(function (cart) {
      setCartCount(cart.item_count);
      var body = qs("[data-cart-body]");
      var foot = qs("[data-cart-foot]");
      if (!body) return;
      if (!cart.items.length) {
        body.innerHTML = "<p>Your cart is empty.</p>";
        if (foot) foot.hidden = true;
        return;
      }
      body.innerHTML = cart.items.map(function (item) {
        var opts = (item.options_with_values || []).filter(function (o) { return o.value !== "Default Title"; })
          .map(function (o) { return "<div>" + o.name + ": " + o.value + "</div>"; }).join("");
        return '<article class="drawer-line">' +
          '<a href="' + item.url + '"><img src="' + (item.image || "") + '" alt=""></a>' +
          "<div><a href=\"" + item.url + "\">" + item.product_title + "</a>" +
          opts +
          "<div>" + formatMoney(item.final_line_price) + "</div>" +
          '<label class="visually-hidden" for="qty-' + item.key + '">Quantity</label>' +
          '<input class="input" style="width:72px;margin-top:6px" id="qty-' + item.key + '" type="number" min="0" value="' + item.quantity + '" data-line-key="' + item.key + '">' +
          '<button type="button" class="remove-link" data-remove-key="' + item.key + '">Remove</button>' +
          "</div></article>";
      }).join("");
      if (foot) {
        foot.hidden = false;
        var total = qs("[data-cart-total]");
        if (total) total.textContent = formatMoney(cart.total_price);
        var ship = qs("[data-ship-message]");
        var threshold = (window.Jettribe && window.Jettribe.freeShipping) || 0;
        if (ship && threshold > 0) {
          if (cart.total_price >= threshold) ship.textContent = "This order qualifies for free USA shipping.";
          else ship.textContent = "Add " + formatMoney(threshold - cart.total_price) + " more for free USA shipping.";
        }
      }
    });
  }

  function changeLine(key, quantity) {
    return fetchJSON("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity })
    }).then(function () { return renderCart(); });
  }

  document.addEventListener("change", function (event) {
    var input = event.target.closest("[data-line-key]");
    if (!input) return;
    changeLine(input.getAttribute("data-line-key"), Number(input.value || 0)).catch(function (err) { alert(err.message); });
  });
  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-remove-key]");
    if (!btn) return;
    changeLine(btn.getAttribute("data-remove-key"), 0).catch(function (err) { alert(err.message); });
  });

  function addItem(id, quantity, properties) {
    var payload = { id: Number(id), quantity: Number(quantity || 1) };
    if (properties && Object.keys(properties).length) payload.properties = properties;
    return fetchJSON("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  document.addEventListener("click", function (event) {
    var add = event.target.closest("[data-add-variant]");
    if (!add) return;
    event.preventDefault();
    add.disabled = true;
    addItem(add.getAttribute("data-add-variant"), 1).then(function () {
      return renderCart();
    }).then(openCart).catch(function (err) {
      alert(err.message);
    }).finally(function () { add.disabled = false; });
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches("[data-product-form]")) return;
    var submitter = event.submitter;
    if (!submitter || !submitter.hasAttribute("data-add-button")) return;
    var data = new FormData(form);
    var hasFile = false;
    data.forEach(function (value) {
      if (typeof File !== "undefined" && value instanceof File && value.size > 0) hasFile = true;
    });
    if (hasFile) return;
    event.preventDefault();
    var properties = {};
    data.forEach(function (value, key) {
      if (key.indexOf("properties[") === 0 && String(value).trim() && !(value instanceof File)) {
        properties[key.slice(11, -1)] = value;
      }
    });
    var button = qs("[data-add-button]", form);
    if (button) button.disabled = true;
    addItem(data.get("id"), data.get("quantity") || 1, properties).then(function () {
      return renderCart();
    }).then(function () {
      var modal = qs("[data-quick-modal]");
      if (modal) modal.hidden = true;
      var backdrop = qs("[data-modal-backdrop]");
      if (backdrop) backdrop.hidden = true;
      openCart();
    }).catch(function (err) {
      var box = qs("[data-product-error]", form) || qs("[data-quick-error]");
      if (box) { box.hidden = false; box.textContent = err.message; }
      else alert(err.message);
    }).finally(function () { if (button) button.disabled = false; });
  });

  /* Product page variants */
  var productJsonEl = qs("[data-product-json]");
  if (productJsonEl) {
    var product = JSON.parse(productJsonEl.textContent);
    var form = qs("[data-product-form]");
    var idInput = qs("[data-variant-id]", form);
    var priceEl = qs("[data-product-price]");
    var skuEl = qs("[data-sku]");
    var button = qs("[data-add-button]", form);

    function selectedOptions() {
      return qsa("[data-option-index]", form).map(function (group) {
        var checked = qs("input:checked", group);
        return checked ? checked.value : "";
      });
    }

    function findVariant(options) {
      var matches = product.variants.filter(function (variant) {
        return variant.options.every(function (opt, i) {
          return !options[i] || opt === options[i];
        });
      });
      matches.sort(function (a, b) { return a.price - b.price; });
      return matches[0];
    }

    function isAddonGroup(group) {
      var name = group.getAttribute("data-option-name") || "";
      if (/design|letter/i.test(name)) return false;
      var values = qsa("input", group).map(function (input) { return input.value; }).join(" ");
      var priced = /\$\s*\d/.test(name) || /\$\s*\d/.test(values);
      if (!priced) return false;
      return /add-?on|plate|sock|custom/i.test(name);
    }

    function markSelected(group) {
      qsa("label", group).forEach(function (label) {
        var input = qs("input", label);
        label.classList.toggle("is-selected", !!(input && input.checked));
      });
    }

    function chooseNone(group) {
      var real = qsa("input", group).filter(function (input) {
        return /^none$/i.test(String(input.value || "").trim());
      })[0];
      if (!real && !qs("input[data-addon-none]", group)) {
        var sample = qs("input", group);
        if (!sample) return;
        var label = document.createElement("label");
        label.innerHTML = '<input type="radio" name="' + sample.name + '" value="" data-option-input data-addon-none><span>None</span>';
        group.insertBefore(label, group.firstChild);
        real = qs("input[data-addon-none]", group);
      }
      if (!qs("[data-addon-note]", group.parentElement)) {
        var note = document.createElement("p");
        note.className = "addon-note";
        note.setAttribute("data-addon-note", "");
        note.textContent = "Choose None if you do not want this add-on.";
        group.insertAdjacentElement("afterend", note);
      }
      if (!real) return;
      qsa("input", group).forEach(function (input) { input.checked = input === real; });
      markSelected(group);
    }

    function selectedLetter() {
      var letter = "";
      qsa("[data-option-index]", form).forEach(function (group) {
        var checked = qs("input:checked", group);
        if (!checked) return;
        var value = String(checked.value || "").trim();
        if (/^[A-Za-z]$/.test(value)) letter = value.toUpperCase();
      });
      return letter;
    }

    function showLetterImage(letter) {
      if (!letter) return;
      var token = new RegExp("(^|[^A-Za-z0-9])" + letter + "([^A-Za-z0-9]|$)", "i");
      var hint = /plate|letter|design|font|custom/i;
      var pool = qsa("[data-thumb]").map(function (thumb) {
        return {
          src: thumb.getAttribute("data-src") || "",
          alt: thumb.getAttribute("data-alt") || "",
          thumb: thumb
        };
      });
      qsa(".product-lower .rte img").forEach(function (img) {
        pool.push({ src: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "", thumb: null });
      });
      var hit = null;
      pool.some(function (item) {
        var hay = item.alt + " " + item.src;
        if (token.test(hay) && hint.test(hay)) {
          hit = item;
          return true;
        }
        return false;
      });
      if (!hit || !hit.src) return;
      var main = qs("[data-gallery-main]");
      if (main) main.src = hit.src;
      qsa("[data-thumb]").forEach(function (el) { el.classList.remove("is-active"); });
      if (hit.thumb) hit.thumb.classList.add("is-active");
    }

    function refreshAvailability() {
      var options = selectedOptions();
      qsa("[data-option-index]", form).forEach(function (group, index) {
        qsa("input", group).forEach(function (input) {
          var trial = options.slice();
          trial[index] = input.value;
          var match = product.variants.some(function (variant) {
            return variant.available && variant.options.every(function (opt, i) {
              return trial[i] === "" || opt === trial[i];
            });
          });
          input.parentElement.classList.toggle("is-unavailable", !match);
        });
      });
    }

    function applyVariant() {
      var variant = findVariant(selectedOptions());
      refreshAvailability();
      if (!variant) {
        if (button) { button.disabled = true; button.textContent = "Unavailable"; }
        return;
      }
      idInput.value = variant.id;
      if (priceEl) {
        var html = "";
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          html += "<s>" + formatMoney(variant.compare_at_price) + "</s> ";
        }
        html += "Now: " + formatMoney(variant.price);
        priceEl.innerHTML = html;
      }
      var paypalNote = qs("[data-pp-message]");
      if (paypalNote) {
        paypalNote.setAttribute("data-pp-amount", (variant.price / 100).toFixed(2));
        paypalNote.removeAttribute("data-pp-mounted");
        mountPayPalMessages();
      }
      if (skuEl) {
        var sku = variant.sku || skuEl.getAttribute("data-fallback-sku") || "";
        skuEl.textContent = sku ? "SKU: " + sku : "";
      }
      if (button) {
        button.disabled = !variant.available;
        button.textContent = variant.available ? "Add to Cart" : "Out of Stock";
      }
      if (variant.featured_image) {
        var main = qs("[data-gallery-main]");
        if (main) main.src = variant.featured_image.src;
      }
      showLetterImage(selectedLetter());
      var noneChoice = qs("input[data-addon-none]:checked", form);
      var noneField = qs("[data-addon-choice]", form);
      if (noneChoice) {
        if (!noneField) {
          noneField = document.createElement("input");
          noneField.type = "hidden";
          noneField.name = "properties[Add-on choice]";
          noneField.setAttribute("data-addon-choice", "");
          form.appendChild(noneField);
        }
        noneField.disabled = false;
        noneField.value = "None";
      } else if (noneField) {
        noneField.disabled = true;
      }
      var url = new URL(window.location.href);
      url.searchParams.set("variant", variant.id);
      window.history.replaceState({}, "", url);
    }

    form.addEventListener("change", function (event) {
      if (event.target.matches("[data-option-input]")) {
        var group = event.target.closest("[data-option-index]");
        if (group) markSelected(group);
        applyVariant();
      }
    });
    if (!new URL(window.location.href).searchParams.get("variant")) {
      qsa("[data-option-index]", form).forEach(function (group) {
        if (isAddonGroup(group)) chooseNone(group);
      });
    }
    applyVariant();

    qsa("[data-thumb]").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var main = qs("[data-gallery-main]");
        if (main && thumb.getAttribute("data-src")) main.src = thumb.getAttribute("data-src");
        qsa("[data-thumb]").forEach(function (el) { el.classList.remove("is-active"); });
        thumb.classList.add("is-active");
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
  }

  function optionLabel(option) {
    if (option && typeof option === "object") return option.name || option.label || "";
    return option == null ? "" : String(option);
  }
  function isNoneValue(value) {
    return /^none$/i.test(String(value || "").trim());
  }
  function isAddonLabel(label, values) {
    if (/design|letter/i.test(label)) return false;
    var blob = label + " " + (values || []).join(" ");
    return /\$\s*\d/.test(blob) && /add-?on|plate|sock|custom/i.test(blob);
  }
  function canonicalSize(value) {
    return String(value || "").trim().replace(/\s*\/\s*/g, "/");
  }
  function productSku(prod, variant) {
    if (variant && variant.sku) return variant.sku;
    var best = "";
    (prod.variants || []).forEach(function (item) {
      if (!item.sku) return;
      if (!best || String(item.sku).length < best.length) best = item.sku;
    });
    return best;
  }
  function displayOption(label, value) {
    return /size/i.test(label || "") ? canonicalSize(value) : String(value == null ? "" : value);
  }

  /* Quick view */
  var quickModal = qs("[data-quick-modal]");
  var modalBackdrop = qs("[data-modal-backdrop]");
  function closeQuick() {
    if (quickModal) quickModal.hidden = true;
    if (modalBackdrop) modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }
  qsa("[data-close-quick]").forEach(function (el) { el.addEventListener("click", closeQuick); });

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-quick-view]");
    if (!trigger) return;
    event.preventDefault();
    var handle = trigger.getAttribute("data-quick-view");
    fetchJSON("/products/" + handle + ".js").then(function (prod) {
      var body = qs("[data-quick-body]");
      if (!body) return;
      var optionsHtml = "";
      var picked = [];
      (prod.options || []).forEach(function (option, index) {
        var label = optionLabel(option);
        if (!label || label === "Title") return;
        var values = [];
        (prod.variants || []).forEach(function (variant) {
          var value = (variant.options || [])[index];
          if (value && values.indexOf(value) === -1) values.push(value);
        });
        if (!values.length) return;
        var addon = isAddonLabel(label, values);
        var noneAt = -1;
        values.forEach(function (value, valueIndex) {
          if (noneAt === -1 && isNoneValue(value)) noneAt = valueIndex;
        });
        var checkedAt = addon && noneAt !== -1 ? noneAt : 0;
        picked[index] = values[checkedAt];
        var isColor = /colou?r/i.test(label);
        optionsHtml += '<div class="option-label">' + escapeHtml(label) + '</div><div class="option-values' + (isColor ? " option-values--color" : "") + '" data-option-index="' + index + '" data-option-name="' + escapeHtml(label) + '">';
        values.forEach(function (value, valueIndex) {
          var swatch = isColor ? '<i style="--swatch: ' + swatchBackground(value) + '"></i>' : "";
          var on = valueIndex === checkedAt;
          optionsHtml += '<label class="' + (isColor ? "swatch " : "") + (on ? "is-selected" : "") + '"><input type="radio" name="quick-option-' + index + '" value="' + escapeHtml(value) + '"' + (on ? " checked" : "") + ' data-option-input>' + swatch + '<span>' + escapeHtml(displayOption(label, value)) + "</span></label>";
        });
        optionsHtml += "</div>";
      });
      var variant = (prod.variants || []).filter(function (item) {
        return (item.options || []).every(function (opt, i) { return picked[i] == null || opt === picked[i]; });
      }).sort(function (a, b) {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return a.price - b.price;
      })[0] || (prod.variants || [])[0];
      if (!variant) return;
      var sku = productSku(prod, variant);
      var image = prod.featured_image || "";
      if (image && typeof image === "object") image = image.src || image.url || "";
      body.innerHTML =
        '<div class="quick-grid"><div><img src="' + escapeHtml(image) + '" alt=""></div><div>' +
        "<h3>" + escapeHtml(prod.title) + "</h3>" +
        '<div class="price" data-product-price>Now: ' + formatMoney(variant.price) + "</div>" +
        (sku ? '<p class="sku" data-sku>SKU: ' + escapeHtml(sku) + "</p>" : '<p class="sku" data-sku></p>') +
        '<form data-product-form><input type="hidden" name="id" value="' + variant.id + '" data-variant-id>' +
        optionsHtml +
        '<div class="qty-row"><label for="quick-qty">Qty</label><input class="input" id="quick-qty" name="quantity" type="number" min="1" value="1"></div>' +
        '<p class="form-errors" data-product-error hidden></p>' +
        '<button class="btn btn--full" type="submit" data-add-button>' + (variant.available ? "Add to Cart" : "Out of Stock") + "</button>" +
        '<a class="btn btn--dark btn--full" href="/checkout" style="margin-top:8px;">Checkout</a>' +
        '<p style="margin-top:10px"><a href="' + escapeHtml(prod.url) + '">View full details</a></p>' +
        "</form></div></div>";
      body.dataset.product = JSON.stringify(prod);
      if (quickModal) quickModal.hidden = false;
      if (modalBackdrop) modalBackdrop.hidden = false;
      document.body.style.overflow = "hidden";

      var qForm = qs("[data-product-form]", body);
      function sync() {
        var options = [];
        qsa("[data-option-index]", qForm).forEach(function (group) {
          var checked = qs("input:checked", group);
          options[Number(group.getAttribute("data-option-index"))] = checked ? checked.value : "";
          qsa("label", group).forEach(function (label) {
            var input = qs("input", label);
            label.classList.toggle("is-selected", !!(input && input.checked));
          });
        });
        var matches = (prod.variants || []).filter(function (item) {
          return (item.options || []).every(function (opt, i) { return options[i] == null || options[i] === "" || opt === options[i]; });
        }).sort(function (a, b) { return a.price - b.price; });
        var match = matches[0];
        if (!match) return;
        qs("[data-variant-id]", qForm).value = match.id;
        qs("[data-product-price]", body).textContent = "Now: " + formatMoney(match.price);
        var skuEl = qs("[data-sku]", body);
        var nextSku = productSku(prod, match);
        if (skuEl) skuEl.textContent = nextSku ? "SKU: " + nextSku : "";
        var btn = qs("[data-add-button]", qForm);
        btn.disabled = !match.available;
        btn.textContent = match.available ? "Add to Cart" : "Out of Stock";
        if (match.featured_image && match.featured_image.src) qs("img", body).src = match.featured_image.src;
      }
      qForm.addEventListener("change", sync);
    }).catch(function () { window.location.href = "/products/" + handle; });
  });

  /* Wishlist */
  var WISH_KEY = "jettribe_wishlist";
  function readWish() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function writeWish(list) {
    localStorage.setItem(WISH_KEY, JSON.stringify(list));
    qsa("[data-wish-count]").forEach(function (el) { el.textContent = list.length ? "(" + list.length + ")" : ""; });
  }
  writeWish(readWish());

  document.addEventListener("click", function (event) {
    var wishBtn = event.target.closest("[data-wish-toggle]");
    if (!wishBtn) return;
    event.preventDefault();
    var handle = wishBtn.getAttribute("data-wish-toggle");
    var list = readWish();
    var idx = list.indexOf(handle);
    if (idx === -1) list.push(handle);
    else list.splice(idx, 1);
    writeWish(list);
    wishBtn.textContent = idx === -1 ? "Saved" : "Wishlist";
  });

  var wishDrawer = qs("[data-wish-drawer]");
  var wishBackdrop = qs("[data-wish-backdrop]");
  function closeWish() {
    if (wishDrawer) wishDrawer.hidden = true;
    if (wishBackdrop) wishBackdrop.hidden = true;
    document.body.style.overflow = "";
  }
  qsa("[data-close-wish]").forEach(function (el) { el.addEventListener("click", closeWish); });
  qsa("[data-open-wish]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      var list = readWish();
      var body = qs("[data-wish-body]");
      if (!list.length) {
        body.innerHTML = "<p>Your wishlist is empty. Save gear from any product card.</p>";
      } else {
        body.innerHTML = "<p>Loading saved gear…</p>";
        Promise.all(list.map(function (handle) {
          return fetchJSON("/products/" + handle + ".js").catch(function () { return null; });
        })).then(function (products) {
          body.innerHTML = products.filter(Boolean).map(function (prod) {
            return '<article class="drawer-line"><a href="' + prod.url + '"><img src="' + (prod.featured_image || "") + '" alt=""></a><div><a href="' + prod.url + '">' + prod.title + '</a><div class="price">' + formatMoney(prod.price) + '</div><button type="button" class="remove-link" data-wish-toggle="' + prod.handle + '">Remove</button></div></article>';
          }).join("") || "<p>Your wishlist is empty.</p>";
        });
      }
      if (wishDrawer) wishDrawer.hidden = false;
      if (wishBackdrop) wishBackdrop.hidden = false;
    });
  });

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
  function paintCompare() {
    var bar = qs("[data-compare-bar]");
    if (!bar) return;
    var list = readCompare();
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
    qsa("input[data-compare-add]").forEach(function (input) {
      input.checked = ids.indexOf(String(input.getAttribute("data-id"))) !== -1;
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
      price: el.getAttribute("data-price") || "0",
      img: el.getAttribute("data-img") || "",
      url: el.getAttribute("data-url") || "#"
    };
  }
  document.addEventListener("change", function (event) {
    var input = event.target.closest && event.target.closest("input[data-compare-add]");
    if (!input) return;
    var id = input.getAttribute("data-id");
    var list = readCompare().filter(function (item) { return String(item.id) !== String(id); });
    if (input.checked) {
      if (list.length >= 4) {
        input.checked = false;
        var bar = qs("[data-compare-bar]");
        if (bar) bar.hidden = false;
        var label = qs("[data-compare-label]");
        if (label) label.textContent = "Compare up to 4 products";
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
      if (list.some(function (item) { return String(item.id) === String(id); })) {
        writeCompare(list.filter(function (item) { return String(item.id) !== String(id); }));
      } else if (list.length >= 4) {
        var full = qs("[data-compare-bar]");
        if (full) full.hidden = false;
        var note = qs("[data-compare-label]");
        if (note) note.textContent = "Compare up to 4 products";
      } else {
        list.push(itemFrom(button));
        writeCompare(list);
      }
      return;
    }
    var remove = event.target.closest && event.target.closest("[data-compare-remove]");
    if (remove) {
      var rid = remove.getAttribute("data-compare-remove");
      writeCompare(readCompare().filter(function (item) { return String(item.id) !== String(rid); }));
      var modal = qs("[data-compare-modal]");
      if (modal && !modal.hidden && readCompare().length < 2) {
        modal.hidden = true;
        document.body.style.overflow = "";
      } else if (modal && !modal.hidden) {
        openCompare();
      }
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-clear]")) {
      writeCompare([]);
      var openModal = qs("[data-compare-modal]");
      if (openModal) openModal.hidden = true;
      document.body.style.overflow = "";
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-open]")) {
      openCompare();
      return;
    }
    if (event.target.closest && event.target.closest("[data-compare-close]")) {
      var closeModal = qs("[data-compare-modal]");
      if (closeModal) closeModal.hidden = true;
      document.body.style.overflow = "";
      return;
    }
    if (event.target.matches && event.target.matches("[data-compare-modal]")) {
      event.target.hidden = true;
      document.body.style.overflow = "";
    }
  });
  function openCompare() {
    var picked = readCompare();
    var label = qs("[data-compare-label]");
    if (picked.length < 2) {
      if (label) label.textContent = "Select at least 2 products";
      return;
    }
    var grid = qs("[data-compare-grid]");
    if (!grid) return;
    grid.innerHTML = picked.map(function (item) {
      return '<article class="compare-col"><a href="' + esc(item.url) + '"><img src="' + esc(item.img) + '" alt=""></a><h3><a href="' + esc(item.url) + '">' + esc(item.title) + '</a></h3><p class="price">Now: ' + formatMoney(Number(item.price) || 0) + '</p><a class="btn" href="' + esc(item.url) + '">View</a><button type="button" class="remove-link" data-compare-remove="' + esc(item.id) + '">Remove</button></article>';
    }).join("");
    qs("[data-compare-modal]").hidden = false;
    document.body.style.overflow = "hidden";
  }
  paintCompare();

  qsa("[data-price-range]").forEach(function (box) {
    var minR = qs('[data-range="min"]', box);
    var maxR = qs('[data-range="max"]', box);
    if (!minR || !maxR) return;
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
      if (minL) minL.textContent = formatMoney(a * 100);
      if (maxL) maxL.textContent = formatMoney(b * 100);
    }
    minR.addEventListener("input", function () { sync("min"); });
    maxR.addEventListener("input", function () { sync("max"); });
    minR.addEventListener("change", function () { box.submit(); });
    maxR.addEventListener("change", function () { box.submit(); });
  });

  var colorWords = [
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
  function titleColors(text) {
    return colorWords.filter(function (row) { return row[2].test(text || ""); }).map(function (row) { return row[0]; });
  }
  var colorList = qs("[data-client-color-list]");
  var sizeList = qs("[data-client-size-list]");
  if (colorList || sizeList) {
    var cards = qsa(".product-grid .card");
    var colorCounts = {};
    var sizeCounts = {};
    cards.forEach(function (card) {
      var titleEl = qs(".card-title", card);
      titleColors(titleEl ? titleEl.textContent : "").forEach(function (name) {
        colorCounts[name] = (colorCounts[name] || 0) + 1;
      });
      (card.getAttribute("data-sizes") || "").split("|").filter(Boolean).forEach(function (size) {
        var key = canonicalSize(size);
        sizeCounts[key] = (sizeCounts[key] || 0) + 1;
      });
    });
    var colorNames = Object.keys(colorCounts);
    var sizeNames = Object.keys(sizeCounts);
    if (colorList && colorNames.length) {
      colorList.innerHTML = colorNames.map(function (name) {
        var hex = "#c8c8c8";
        colorWords.forEach(function (row) { if (row[0] === name) hex = row[1]; });
        return '<button type="button" class="swatch" data-client-color="' + escapeHtml(name) + '" style="--swatch:' + hex + '"><i></i><span>' + escapeHtml(name) + "</span></button>";
      }).join("");
      var colorFacet = colorList.closest("[data-client-colors]");
      if (colorFacet) colorFacet.hidden = false;
    }
    if (sizeList && sizeNames.length) {
      sizeList.innerHTML = sizeNames.map(function (size) {
        return '<button type="button" class="size-chip" data-client-size="' + escapeHtml(size) + '">' + escapeHtml(size) + "</button>";
      }).join("");
      var sizeFacet = sizeList.closest("[data-client-sizes]");
      if (sizeFacet) sizeFacet.hidden = false;
    }
    function applyClientFacets() {
      var colors = qsa("[data-client-color].is-active").map(function (el) { return el.getAttribute("data-client-color"); });
      var sizes = qsa("[data-client-size].is-active").map(function (el) { return el.getAttribute("data-client-size"); });
      cards.forEach(function (card) {
        var titleEl = qs(".card-title", card);
        var hasColor = titleColors(titleEl ? titleEl.textContent : "");
        var hasSize = (card.getAttribute("data-sizes") || "").split("|").filter(Boolean).map(canonicalSize);
        var colorOk = !colors.length || colors.some(function (color) { return hasColor.indexOf(color) !== -1; });
        var sizeOk = !sizes.length || sizes.some(function (size) { return hasSize.indexOf(canonicalSize(size)) !== -1; });
        card.hidden = !(colorOk && sizeOk);
      });
    }
    qsa("[data-client-color], [data-client-size]").forEach(function (button) {
      button.addEventListener("click", function () {
        button.classList.toggle("is-active");
        applyClientFacets();
      });
    });
  }

  document.addEventListener("catalog:rendered", paintCompare);

  function menuHandle(href) {
    try {
      return new URL(href, window.location.origin).searchParams.get("jtcat") || "";
    } catch (err) {
      return "";
    }
  }
  function menuCount(data, handle) {
    if (!handle) return null;
    var cats = data.categories || {};
    var key = cats[handle] ? handle : "";
    if (!key) {
      var lower = handle.toLowerCase();
      Object.keys(cats).some(function (name) {
        if (name.toLowerCase() === lower) {
          key = name;
          return true;
        }
        return false;
      });
    }
    if (!key) return null;
    return (cats[key].products || []).length;
  }
  function hideEmptyMenu(data) {
    qsa(".mega-col").forEach(function (col) {
      var links = qsa("a[href*='jtcat=']", col);
      var stocked = false;
      var known = 0;
      links.forEach(function (link) {
        var count = menuCount(data, menuHandle(link.getAttribute("href")));
        if (count === null) stocked = true;
        else {
          known += 1;
          if (count > 0) stocked = true;
        }
      });
      if (known && !stocked) {
        col.hidden = true;
        return;
      }
      links.forEach(function (link) {
        var count = menuCount(data, menuHandle(link.getAttribute("href")));
        if (count !== 0) return;
        if (link.classList.contains("mega-head")) return;
        link.hidden = true;
      });
    });
    qsa("a[href*='jtcat=']").forEach(function (link) {
      if (link.closest(".mega-col")) return;
      if (link.parentElement && link.parentElement.classList.contains("has-sub")) return;
      if (menuCount(data, menuHandle(link.getAttribute("href"))) !== 0) return;
      var item = link.closest("li");
      if (item && qsa("a[href*='jtcat=']", item).length === 1 && !item.classList.contains("has-sub")) item.hidden = true;
      else link.hidden = true;
    });
  }
  if (window.Jettribe && Jettribe.catalogUrl && !Jettribe.showEmptyMenuItems) {
    fetch(Jettribe.catalogUrl, { headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { if (data) hideEmptyMenu(data); })
      .catch(function () {});
  }

  function mountPayPalMessages(root) {
    var sdk = window.paypalMessages;
    if (!sdk || !sdk.Messages) return;
    qsa("[data-pp-message]", root || document).forEach(function (el) {
      var amount = el.getAttribute("data-pp-amount") || "";
      if (el.getAttribute("data-pp-mounted") === amount && el.childNodes.length) return;
      el.innerHTML = "";
      el.setAttribute("data-pp-mounted", amount);
      var props = {
        placement: el.getAttribute("data-pp-placement") || "product",
        style: {
          layout: "text",
          logo: { type: "inline", position: "left" },
          text: { color: "black", size: "12" }
        }
      };
      if (amount) props.amount = amount;
      sdk.Messages(props).render(el);
    });
  }
  document.addEventListener("paypal:ready", function () { mountPayPalMessages(); });
  mountPayPalMessages();

  /* Cart page quantity posts stay native. Gallery on cart is server rendered. */
  function reviewStars(count) {
    var n = Math.max(0, Math.min(5, Number(count) || 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }
  function paintReviews(root, list) {
    if (!root) return;
    var tab = qs('[data-tab="reviews"]');
    if (!list || !list.length) {
      root.innerHTML = "<p>No reviews for this product yet.</p>";
      if (tab) tab.textContent = "Reviews";
      return;
    }
    if (tab) tab.textContent = "Reviews (" + list.length + ")";
    var total = list.reduce(function (sum, review) { return sum + Number(review.rating || 0); }, 0);
    var html = '<p class="review-meta"><span class="review-stars" aria-hidden="true">' + reviewStars(Math.round(total / list.length)) + "</span> " + list.length + (list.length === 1 ? " review" : " reviews") + '</p><div class="review-list">';
    list.forEach(function (review) {
      html += '<article class="review-card"><div class="review-stars" aria-label="' + esc(review.rating || 0) + ' out of 5">' + reviewStars(review.rating) + "</div>";
      if (review.title) html += "<h3>" + esc(review.title) + "</h3>";
      html += '<p class="review-meta">' + esc(review.author || "Customer") + (review.date ? " · " + esc(review.date) : "") + "</p>";
      html += "<p>" + esc(review.body || "") + "</p>";
      if (review.image) html += '<p><img src="' + esc(review.image) + '" alt="' + esc(review.title || "Customer photo") + '" width="280" loading="lazy"></p>';
      html += "</article>";
    });
    root.innerHTML = html + "</div>";
    var old = qs("script[data-review-schema]");
    if (old) old.remove();
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": (qs(".product-title") || {}).textContent || "",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (total / list.length).toFixed(1),
        "reviewCount": String(list.length)
      },
      "review": list.slice(0, 8).map(function (review) {
        return {
          "@type": "Review",
          "author": { "@type": "Person", "name": review.author || "Customer" },
          "datePublished": review.date || "",
          "name": review.title || "",
          "reviewBody": review.body || "",
          "reviewRating": { "@type": "Rating", "ratingValue": String(review.rating || 0), "bestRating": "5" }
        };
      })
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-review-schema", "");
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
  function demoteExtraHeadings() {
    qsa(".rte h1, .product-lower h1").forEach(function (heading) {
      if (heading.classList.contains("product-title")) return;
      var next = document.createElement("h2");
      next.innerHTML = heading.innerHTML;
      next.className = heading.className;
      heading.replaceWith(next);
    });
  }
  demoteExtraHeadings();
  document.addEventListener("catalog:rendered", demoteExtraHeadings);
  var reviewRoot = qs("[data-product-reviews]");
  if (reviewRoot && window.Jettribe && Jettribe.reviewsUrl) {
    fetch(Jettribe.reviewsUrl, { headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (data) {
        paintReviews(reviewRoot, data[reviewRoot.getAttribute("data-product-reviews")] || []);
      })
      .catch(function () {});
  }

  qsa("[data-country-select]").forEach(function (country) {
    var province = qs("#" + country.getAttribute("data-province"));
    if (!province || !window.Shopify || !Shopify.CountryProvinceSelector) return;
    new Shopify.CountryProvinceSelector(country.id, province.id, {
      hideElement: country.getAttribute("data-province-container")
    });
  });
})();
