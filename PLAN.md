# Jettribe rebuild — plan & findings

## assets-source / live site

- `www.jettribe.co` → **HTTP 500** (unavailable). Imported from **`www.jettribe.com`** (BigCommerce) instead.
- No CSV export was provided; scraped **550 products** + **26 pages** + logos/heroes + testimonials/contact from the live store.
- Accent from logo: `#4050E8` (blue) + sale `#E04040`.
- Redirect map generated at `assets-source/products/url-redirects.json`.

## Build approach

1. Custom WordPress theme `jettribe` + WooCommerce (`.wp-env.json`) — Docker required for `@wordpress/env`.
2. Vite + React + TypeScript storefront for the Nike-style UX, GSAP-ready animations, three.js code-split, Custom Gear Builder, and **Cursor publishable preview** (this VM has no Docker).
3. Re-runnable scrape + WooCommerce import scripts.

## Order of work (prompt §10)

1. Plan + inventory — done (this file)
2. Theme / header / mega / mobile / footer — done in storefront (+ WP theme shell)
3. Product import / listing / PDP / cart — done (JSON import + UI; WP importer ready)
4. Home page — done
5. Animations — core set shipped (header hide, mega fade, promo rotate, reveals, card tilt, heart pop, carousels)
6. 3D — hero float + card tilt + Custom Builder zones; GLB viewer hooks in WP meta (models not supplied)
7. Remaining pages / speed — content pages imported; preview host for review
