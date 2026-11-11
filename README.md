# Jettribe WordPress Theme

Custom WooCommerce theme for Jettribe PWC ride & race gear — speed-first HTML, GSAP motion, and a lazy-loaded three.js “Water Line” hero.

## Quick start (your WordPress host)

1. Download [`preview/downloads/jettribe-theme.zip`](preview/downloads/jettribe-theme.zip) (also in the live preview).
2. In WordPress: **Appearance → Themes → Add New → Upload Theme** → upload the zip → Activate.
3. Install & activate **WooCommerce**.
4. **Settings → Permalinks → Save**.
5. As an admin, open `/?jt_seed_placeholders=1` once to seed PLACEHOLDER draft products (or import `scripts/import-products/out/woocommerce-placeholders.csv`).
6. Drop brand files / CSV / GLBs into `assets-source/` and rebuild when iterating locally.

## Local development

```bash
npm install
npm run build
npm run package:theme
npm run serve:preview   # static design preview at http://127.0.0.1:4173
```

If Docker is available:

```bash
npx @wordpress/env start
```

`.wp-env.json` maps this theme and installs WooCommerce.

## Architecture

- `wp-content/themes/jettribe` — PHP templates, `theme.json`, Woo overrides, Vite `src/` + `dist/`
- `preview/` — static multi-page preview + theme zip download (no WordPress required)
- `BRIEF.md` — full product brief
- `DECISIONS.md` — trade-offs for this build

## Launch checklist

- [ ] Page cache + CDN for hashed `/dist/assets/*`
- [ ] Object cache (Redis/Memcached)
- [ ] Serve AVIF/WebP product images
- [ ] SSL + pretty permalinks
- [ ] Import real catalog; remove PLACEHOLDER products
- [ ] Add GLB models via product “3D” tab
- [ ] Confirm Speculation Rules exclusions for cart/checkout/account
