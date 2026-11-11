# Jettribe — WordPress + WooCommerce rebuild

Nike.com/ca–pattern storefront for **Jettribe**, rebuilt for WordPress/WooCommerce. Live BigCommerce data was imported from [jettribe.com](https://www.jettribe.com) (`jettribe.co` returned HTTP 500 at scrape time).

## What’s in this repo

| Path | Purpose |
|---|---|
| `storefront/` | Vite + React + TypeScript preview of the full Nike-style UX (publishable demo) |
| `wordpress/wp-content/themes/jettribe/` | Custom `jettribe` theme (no page builders) |
| `assets-source/` | Scraped products, pages, logos, heroes, URL redirects |
| `scripts/scrape-jettribe.py` | Re-runnable BigCommerce scrape |
| `scripts/import-woocommerce.mjs` | Re-runnable WooCommerce import via `@wordpress/env` |
| `.wp-env.json` | Local WordPress + WooCommerce (requires Docker) |

## Preview (this environment)

```bash
cd storefront
npm install
npm run dev
# or production preview:
npm run build && npm run preview
```

## WordPress local (when Docker is available)

```bash
npx @wordpress/env start
node scripts/import-woocommerce.mjs
```

Copy `storefront/dist` assets into `wordpress/wp-content/themes/jettribe/assets/` for production enqueue.

## Catalog snapshot

- **550** products (names, SKUs, prices, sale prices, images, categories, descriptions)
- **26** content pages (warranty, shipping, returns, VIP, sponsorship, culture, …)
- Redirect map: `assets-source/products/url-redirects.json`
- Contact: `951-246-3147` · `ridersupport@jettribe.com` · Mon–Fri 9am–5pm PT

## Accent

From the Jettribe logo: brand blue `#4050E8`, sale red `#E04040`.

## Still placeholder / needs your assets

- Product `.glb` 3D models + hotspot JSON (meta box ready in theme)
- Full WooCommerce checkout/account (wired in theme; preview uses local cart)
- Official YouTube video IDs (thumbnails load first; player on click)
- BigCommerce CSV export (if you prefer CSV over the live scrape, drop it in `assets-source/`)
