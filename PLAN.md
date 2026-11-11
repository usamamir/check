# Plan (Phases 1–8 condensed for deliverable)

Goal: ship an installable `jettribe` theme zip + live static preview.

| Phase | Scope | Key paths |
|---|---|---|
| 1 | Theme scaffold, Vite, tokens, base templates | `wp-content/themes/jettribe/**`, `package.json`, `vite.config.ts` |
| 2 | Placeholder products, Woo templates, Store API helpers | `inc/`, `woocommerce/`, `scripts/import-products/` |
| 3 | Motion library, menus, cart, search | `src/motion/`, `src/features/` |
| 4 | SceneManager + Water Line hero | `src/three/` |
| 5 | Product cards + PDP viewer fallbacks | `src/three/`, `src/features/pdp.ts` |
| 6 | Remaining pages, patterns, A8 polish | templates, patterns, motion |
| 7 | Bundle split, critical CSS, budgets | vite config, enqueue |
| 8 | README, package zip, preview deploy | `README.md`, `preview/`, scripts |

## Risks
- No Docker → cannot run real WP/Woo locally; preview is static.
- No product export / GLBs → placeholders and procedural/image fallbacks.
- Club GSAP plugins unavailable → free alternatives.
