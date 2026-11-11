# Decisions

## Environment
- Docker / `@wordpress/env` are unavailable in this Cloud Agent VM. Built a complete installable theme plus a static HTML preview for deployment and download.
- PHP is not installed here; theme PHP follows WordPress coding standards and is validated structurally.

## Site purpose
- Full WooCommerce store with checkout (default from brief).

## Brand / assets
- No files in `assets-source/brand|products|models|photos`. Using A4 palette defaults and PLACEHOLDER products from A5.

## Stack notes
- GSAP Club `SplitText` is proprietary; implemented a lightweight line/character splitter in `src/motion/split.ts`.
- View Transitions and Speculation Rules configured; graceful no-op where unsupported.
- 3D bundle is a separate Vite entry (`three`) and loaded only via dynamic `import()`.

## Preview
- Static `preview/` mirrors home / shop / product / about using the same built CSS/JS so the design can be reviewed without WordPress.
- Theme zip is served from the preview app and also written to `/opt/cursor/artifacts/`.
