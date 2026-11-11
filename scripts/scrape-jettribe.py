#!/usr/bin/env python3
"""Scrape Jettribe BigCommerce catalog into assets-source for WP import + preview."""
from __future__ import annotations

import concurrent.futures
import html as html_lib
import json
import pathlib
import re
import time
import urllib.error
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets-source"
PRODUCT_URLS = pathlib.Path("/tmp/jettribe-scrape/products-1.xml.urls")
PAGE_URLS = pathlib.Path("/tmp/jettribe-scrape/pages-1.xml.urls")
CAT_URLS = pathlib.Path("/tmp/jettribe-scrape/categories-1.xml.urls")

UA = (
    "Mozilla/5.0 (compatible; JettribeRebuildBot/1.0; +https://www.jettribe.com)"
)


def fetch(url: str, timeout: int = 40) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def unescape_js_string(s: str) -> str:
    # stencilBootstrap second arg is a JSON string that may contain escaped quotes
    try:
        return json.loads(f'"{s}"')
    except json.JSONDecodeError:
        return (
            s.encode("utf-8")
            .decode("unicode_escape")
            .replace('\\"', '"')
            .replace("\\/", "/")
        )


def extract_stencil(html: str, kind: str) -> dict[str, Any] | None:
    # window.stencilBootstrap("product", "{...}")
    m = re.search(
        rf'window\.stencilBootstrap\(\s*"{kind}"\s*,\s*"((?:\\.|[^"\\])*)"\s*\)',
        html,
    )
    if not m:
        return None
    raw = unescape_js_string(m.group(1))
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # sometimes double-encoded
        try:
            return json.loads(raw.encode("utf-8").decode("unicode_escape"))
        except Exception:
            return None


def clean_text(s: str | None) -> str:
    if not s:
        return ""
    return html_lib.unescape(re.sub(r"\s+", " ", s)).strip()


def parse_money(html: str) -> dict[str, float | None]:
    out: dict[str, float | None] = {
        "price": None,
        "sale_price": None,
        "rrp": None,
    }
    og = re.search(r'property="og:price:standard_amount" content="([^"]+)"', html)
    if og:
        try:
            out["price"] = float(og.group(1))
        except ValueError:
            pass
    sale = re.search(
        r'data-product-price-without-tax[^>]*class="price price--withoutTax"[^>]*>\s*\$([\d,]+\.\d{2})',
        html,
    )
    non_sale = re.search(
        r'data-product-non-sale-price-without-tax[^>]*>\s*\$([\d,]+\.\d{2})',
        html,
    )
    rrp = re.search(r'data-product-rrp-price-without-tax[^>]*>\s*\$([\d,]+\.\d{2})', html)
    now = re.search(r"Now:\s*</span>\s*<span[^>]*>\s*\$([\d,]+\.\d{2})", html)
    if sale:
        out["sale_price"] = float(sale.group(1).replace(",", ""))
    if now:
        out["sale_price"] = float(now.group(1).replace(",", ""))
    if non_sale:
        out["price"] = float(non_sale.group(1).replace(",", ""))
    if rrp:
        out["rrp"] = float(rrp.group(1).replace(",", ""))
    if out["price"] is None and out["sale_price"] is not None:
        out["price"] = out["sale_price"]
        out["sale_price"] = None
    return out


def parse_product(url: str, html: str) -> dict[str, Any]:
    data = extract_stencil(html, "product") or {}
    title = clean_text(
        data.get("productTitle")
        or (re.search(r'class="productView-title"[^>]*>([^<]+)', html) or [None, ""])[1]
    )
    product_id = data.get("productId") or (
        (re.search(r'data-product-id="(\d+)"', html) or [None, None])[1]
    )
    sku_m = re.search(r'"sku"\s*:\s*"([^"]+)"', html)
    sku = data.get("sku") or (sku_m.group(1) if sku_m else "")
    images = []
    for m in re.finditer(
        r'https://cdn11\.bigcommerce\.com/s-09242/images/stencil/(?:original|1280x1280|500x659)/products/\d+/\d+/[^"\\?]+\.(?:jpg|jpeg|png|webp)',
        html,
        re.I,
    ):
        u = m.group(0).split("?")[0]
        # normalize to 1280 for quality/size balance
        u = re.sub(r"/stencil/(?:original|500x659)/", "/stencil/1280x1280/", u)
        if u not in images:
            images.append(u)
    breadcrumbs = data.get("breadcrumbs") or []
    categories = [
        clean_text(b.get("name"))
        for b in breadcrumbs
        if isinstance(b, dict) and b.get("name") and b.get("name") != "Home"
    ][:-1]
    money = parse_money(html)
    desc_m = re.search(
        r'class="productView-description"[^>]*>([\s\S]*?)</div>\s*<div class="productView-',
        html,
    )
    if not desc_m:
        desc_m = re.search(
            r'itemprop="description"[^>]*>([\s\S]*?)</div>', html
        )
    description_html = desc_m.group(1).strip() if desc_m else ""
    description = clean_text(re.sub(r"<[^>]+>", " ", description_html))
    # options / sizes
    sizes = []
    for m in re.finditer(
        r'data-product-attribute-value="(\d+)"[^>]*>\s*<span[^>]*>([^<]+)</span>',
        html,
    ):
        label = clean_text(m.group(2))
        if label and label not in sizes:
            sizes.append(label)
    # fallback size labels from form
    if not sizes:
        for m in re.finditer(
            r'<label[^>]*data-product-attribute-value="\d+"[^>]*>\s*<span[^>]*>([^<]+)</span>',
            html,
        ):
            label = clean_text(m.group(1))
            if label and label not in sizes:
                sizes.append(label)
    # Prefer product-specific availability markers; page chrome often mentions "out of stock".
    avail = re.search(
        r'data-product-available\s*=\s*"(true|false)"|productView-availability[^>]*>[\s\S]{0,120}',
        html,
        re.I,
    )
    if avail and avail.group(1):
        in_stock = avail.group(1).lower() == "true"
    else:
        blob = " ".join(
            re.findall(
                r'class="[^"]*productView-availability[^"]*"[\s\S]{0,200}',
                html,
                re.I,
            )
        ).lower()
        name_l = title.lower()
        if "out of stock" in blob or "out of stock" in name_l:
            in_stock = False
        else:
            in_stock = True
    slug = url.rstrip("/").split("/")[-1]
    old_url = url
    return {
        "id": int(product_id) if product_id else None,
        "sku": sku,
        "name": title,
        "slug": slug,
        "old_url": old_url,
        "new_url": f"/product/{slug}/",
        "price": money["price"],
        "sale_price": money["sale_price"],
        "rrp": money["rrp"],
        "images": images[:8],
        "image": images[0] if images else None,
        "categories": categories,
        "sizes": sizes,
        "description": description[:2000],
        "description_html": description_html[:8000],
        "in_stock": in_stock,
        "breadcrumbs": breadcrumbs,
    }


def scrape_products(limit: int | None = None) -> list[dict[str, Any]]:
    urls = [u.strip() for u in PRODUCT_URLS.read_text().splitlines() if u.strip()]
    if limit:
        urls = urls[:limit]
    products: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    def one(url: str) -> dict[str, Any] | None:
        try:
            html = fetch(url)
            return parse_product(url, html)
        except Exception as e:  # noqa: BLE001
            errors.append({"url": url, "error": str(e)})
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(one, u): u for u in urls}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            done += 1
            if done % 25 == 0 or done == len(urls):
                print(f"products {done}/{len(urls)}", flush=True)
            p = fut.result()
            if p and p.get("name"):
                products.append(p)

    products.sort(key=lambda p: (p.get("id") or 0), reverse=True)
    (OUT / "products" / "products.json").write_text(
        json.dumps(products, indent=2)
    )
    (OUT / "products" / "scrape-errors.json").write_text(
        json.dumps(errors, indent=2)
    )
    redirects = [
        {"from": p["old_url"], "to": p["new_url"], "sku": p.get("sku"), "id": p.get("id")}
        for p in products
    ]
    (OUT / "products" / "url-redirects.json").write_text(
        json.dumps(redirects, indent=2)
    )
    print(f"saved {len(products)} products, {len(errors)} errors")
    return products


def scrape_pages() -> None:
    urls = [u.strip() for u in PAGE_URLS.read_text().splitlines() if u.strip()]
    pages = []
    for url in urls:
        if url.rstrip("/") == "https://www.jettribe.com":
            continue
        try:
            html = fetch(url)
        except Exception as e:  # noqa: BLE001
            print("page fail", url, e)
            continue
        title = clean_text(
            (re.search(r"<title>(.*?)</title>", html) or [None, ""])[1]
        ).replace(" - Jettribe", "")
        # main content guesses
        body = ""
        for pat in [
            r'class="page-content[^"]*"[^>]*>([\s\S]*?)</article>',
            r'class="page"[^>]*>([\s\S]*?)<footer',
            r'<main[^>]*>([\s\S]*?)</main>',
        ]:
            m = re.search(pat, html, re.I)
            if m:
                body = m.group(1)
                break
        text = clean_text(re.sub(r"<script[\s\S]*?</script>", " ", body))
        text = clean_text(re.sub(r"<style[\s\S]*?</style>", " ", text))
        text = clean_text(re.sub(r"<[^>]+>", " ", text))
        slug = url.rstrip("/").split("/")[-1] or "home"
        pages.append(
            {
                "slug": slug,
                "title": title,
                "old_url": url,
                "new_url": f"/{slug}/",
                "text": text[:12000],
            }
        )
        print("page", slug, len(text))
        time.sleep(0.05)
    (OUT / "pages" / "pages.json").write_text(json.dumps(pages, indent=2))


def scrape_categories(products: list[dict[str, Any]]) -> None:
    # derive categories from product breadcrumbs + sitemap names
    cat_urls = [u.strip() for u in CAT_URLS.read_text().splitlines() if u.strip()]
    categories = []
    for url in cat_urls:
        slug = url.rstrip("/").split("/")[-1]
        name = slug.replace("-", " ").title()
        categories.append(
            {
                "slug": slug,
                "name": name,
                "old_url": url,
                "new_url": f"/shop/{slug}/",
            }
        )
    # counts from products
    counts: dict[str, int] = {}
    for p in products:
        for c in p.get("categories") or []:
            counts[c] = counts.get(c, 0) + 1
    (OUT / "categories" / "categories.json").write_text(
        json.dumps({"sitemap": categories, "from_products": counts}, indent=2)
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "products").mkdir(exist_ok=True)
    (OUT / "pages").mkdir(exist_ok=True)
    (OUT / "categories").mkdir(exist_ok=True)
    print("scraping products...")
    products = scrape_products()
    print("scraping pages...")
    scrape_pages()
    scrape_categories(products)
    meta = {
        "source": "https://www.jettribe.com",
        "note": "jettribe.co returned HTTP 500; used jettribe.com BigCommerce storefront",
        "product_count": len(products),
        "contact": {
            "phone": "951-246-3147",
            "email": "ridersupport@jettribe.com",
            "hours": "Mon - Fri, 9am - 5pm PT",
        },
        "testimonials": [
            {
                "quote": "I am very happy with the excellent support from Jettribe.",
                "author": "Yohei Yamamoto",
            },
            {
                "quote": "I'm loving the color combination and how every comes together.",
                "author": "Michael Bernhardt",
            },
            {
                "quote": "We have purchased a number of items (suits and beachwear). The suits are really sharp and great quality. I would give them a 6/5 if I could. You really can’t get better than this!",
                "author": "Derek Corell",
            },
            {
                "quote": "You went above and beyond. The gear looks and feels amazing, and the best customer service!",
                "author": "Jonathan K Espey",
            },
        ],
    }
    (OUT / "site-meta.json").write_text(json.dumps(meta, indent=2))
    print("done")


if __name__ == "__main__":
    main()
