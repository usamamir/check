# Jettribe 3D WordPress Store: Cursor Build Prompt

## How to use this file

1. Create an empty project folder and open it in Cursor.
2. Save this file in the project root as `BRIEF.md`.
3. Create a folder `assets-source/` and add what you have (see Part C). The build works without them, using labeled placeholders.
4. Fill in the `[BRACKETS]` in section A0, or leave the defaults.
5. In Cursor's Agent mode, paste the **Phase 0** prompt from Part B. Then run the phases one at a time and review each before starting the next. Do not paste all phases at once.

---

# PART A: MASTER BRIEF

## A0. Project inputs

| Input | Value |
|---|---|
| Brand | Jettribe: PWC / jet ski ride and race gear |
| Site purpose | `[Full WooCommerce store with checkout]` (default) or `[showcase catalog, no checkout]` |
| Brand colors | `[paste hex codes]`. Default: derive from the logo in `assets-source/brand/`; if none, use the palette in A4 |
| Fonts | `[font names]`. Default: see A4 |
| Product data | `assets-source/products/` CSV export from the current store. If missing, use the placeholder list in A5 |
| 3D models | `assets-source/models/*.glb` if available. If missing, use the no-model fallbacks in A7 |
| Local environment | `@wordpress/env` (Docker). If Docker is unavailable, stop and tell me |
| Production hosting | `[host name]`. Default: unknown, so keep everything host-agnostic |

## A1. Your role and the mission

You are a senior WordPress, WooCommerce and WebGL engineer and motion designer. Build a custom WordPress + WooCommerce store for Jettribe that feels like an award-level 3D product site and still loads and navigates almost instantly.

The site sells riding gear for personal watercraft: wetsuits, tour coats, race boots, ride shoes, gloves, goggles, rashguards, board shorts, PWC covers, bags and accessories. The audience is jet ski racers and recreational riders. The feeling to deliver: speed, water, spray, race-day energy.

## A2. Priorities, in this order

When two goals conflict, the higher one wins.

1. **Speed.** The page is readable and usable before any 3D or animation code runs. Budgets in A10 are hard limits.
2. **Easy browsing.** A shopper finds any product in three clicks or fewer. Menus, filters, search and cart always behave predictably.
3. **3D and motion.** Every interactive element is animated, but animation never blocks input, hides content, or delays navigation.

3D and animation are progressive enhancement. With JavaScript disabled, WebGL unavailable, or reduced motion requested, the site is still a complete, good-looking store.

## A3. Tech stack (fixed, do not substitute without asking)

**Platform**
- Latest stable WordPress and WooCommerce, PHP 8.2+.
- Local development with `@wordpress/env`.
- One custom theme named `jettribe`: PHP templates, template parts, WooCommerce template overrides, and `theme.json` for design tokens.
- No page builders (no Elementor, Divi, WPBakery). No slider plugins. No animation plugins.
- Allowed plugins: WooCommerce only. Propose any other plugin with a reason and its performance cost before installing.

**Front-end build**
- Vite + TypeScript, ES modules, hashed filenames, a manifest that PHP reads to enqueue assets.
- Code-split by route and by feature. The 3D bundle is never in the initial load.
- Modern plain CSS: custom properties, nesting, container queries, `clamp()` type scale. Critical CSS inlined in `<head>`; the rest loaded non-blocking.
- Add no jQuery dependencies of our own. Dequeue WooCommerce scripts and styles on pages that do not need them, without breaking cart, variations or checkout.

**Motion**
- GSAP with ScrollTrigger, Flip and SplitText.
- Lenis for smooth scrolling, synced to GSAP's ticker. Disabled on touch devices if it hurts scroll feel, and disabled for reduced motion.

**3D**
- three.js, WebGL2 as the baseline. A WebGPU path is optional and must not be required.
- GLB models with Meshopt or Draco compression and KTX2 or WebP textures.
- `detect-gpu` (or equivalent) for quality tiering.

**Navigation**
- Keep the site a normal multi-page WordPress site. Do NOT use Barba, Swup, PJAX or a headless/SPA setup; they break WooCommerce scripts.
- Page transitions use native cross-document View Transitions (`@view-transition { navigation: auto; }`), with shared-element morphs.
- Near-instant navigation uses the Speculation Rules API through WordPress core's speculative loading. Set it to prerender with moderate eagerness, and exclude cart, checkout, account and any add-to-cart URLs. Check the current WordPress developer docs for the exact filter names before coding.
- Handle prerendering correctly: do not start intro animations, timers or WebGL while `document.prerendering` is true; start them on `prerenderingchange`.
- Keep the back/forward cache working: no `unload` handlers, and restore UI state on `pageshow`.

**Commerce data**
- Mini-cart, add to cart, quantity changes and predictive search use the WooCommerce Store API with `fetch`. No full page reloads for these.
- Checkout uses the standard WooCommerce checkout, styled to match, with only light animation.

## A4. Design direction

- **Mood:** dark, deep-water base with high-energy color taken from the gear itself. Large confident type, generous spacing, product imagery as the hero.
- **Default palette** (use only if no brand colors are supplied): background `#05080D`, surface `#0D141C`, text `#F4F7FA`, muted text `#8A97A6`, primary accent `#00E5FF`. Each product or collection also sets a `--accent` variable from its colorway, and the UI picks it up on that page.
- **Type:** one condensed, heavy display face for headings (racing feel) and one clean sans for body and UI. Self-host as WOFF2 variable fonts, subset to Latin, `font-display: swap`, preload at most two files.
- **Layout:** 12-column fluid grid, mobile-first, tested at 360, 768, 1024, 1440 and 1920 px.
- **Motion language:** fast and fluid like water. Default easing `power3.out` or `expo.out`; UI durations 0.2 to 0.6 s; larger reveals up to 1.2 s. Nothing bounces. Nothing the user must wait for takes longer than 0.4 s.
- Store all colors, spacing, radii, durations and easings as tokens in `theme.json` and CSS custom properties, and reuse the same duration and easing values in GSAP.

## A5. Product data

**Rules**
- Use only real Jettribe product data from the files in `assets-source/products/`. Never invent names, prices, specs, sizes, reviews or stock levels.
- Inspect the export's columns first, then write a repeatable script (`scripts/import-products`) that converts it to WooCommerce's CSV import format and imports it with WP-CLI. Map variations (size, color), categories, images, SKUs, prices, weights and descriptions.
- Report anything that fails to map instead of guessing.
- Product images are imported into the media library and served as AVIF or WebP with `srcset`, `sizes`, and explicit width and height.

**If no export is present yet**, create these as draft products with no price, each clearly marked `PLACEHOLDER`, so templates can be built. Remove them when real data arrives.
- Circuit 2-Piece Wetsuit Set (John and Jacket), several colorways
- Hyper 2-Piece Wetsuit Set (John and Jacket), several colorways
- Hyper Tour Coat
- GRB Race Boot
- Amphib Ride Shoes
- GP-40 Gloves
- Race Skin PWC Gloves
- Classic Floating Goggles
- Hooded Rashguard
- Board Shorts
- Waterproof Ride Bag
- PWC Cover

**Proposed category tree** (confirm against the export and adjust to match it)
- Wetsuits: 2-Piece Sets, Jackets, Johns, Ladies
- Tour Coats
- Gloves
- Footwear: Race Boots, Ride Shoes, Socks
- Goggles: Goggles, Replacement Lenses
- Apparel: Rashguards, Board Shorts, Hoodies and Tees, Swimwear
- Protection: Race Belts, plus Vests if present in the export
- PWC Covers
- Bags and Accessories
- Outlet

**Extra product fields** (add a "3D" tab in the product editor, stored as product meta)
- `_jt_model_glb`: URL of the product's GLB file (optional)
- `_jt_model_poster`: poster image shown before the model loads
- `_jt_hotspots`: JSON list of `{ label, text, position: [x,y,z] }`
- `_jt_accent`: hex color for the page accent
- `_jt_colorways`: JSON mapping color variation to material or texture set

## A6. Site map and navigation

**Pages**
- Home
- Shop (all products) and category pages
- Collection pages for product series (for example Hyper, Circuit)
- Product detail page (PDP)
- Cart drawer (site-wide) and cart page
- Checkout, order confirmation, My Account
- Size Guide
- About / Race Team
- Dealers
- Support / Contact
- Search results
- 404

**Header**
- Logo, primary nav, search, account, cart with live count.
- Desktop: "Shop" opens a full-width mega menu with every category and subcategory as text links, plus one featured product preview that changes as the user hovers a category.
- Mobile: full-screen menu with accordion categories, large tap targets, cart and search always reachable.
- Sticky header that hides on scroll down and returns on scroll up.

**Browsing aids**
- Breadcrumbs on category and product pages.
- Filters on listing pages: category, size, color, price, in stock. Sort: featured, newest, price. Filter state lives in the URL so pages are shareable and the back button works.
- Predictive search overlay showing products and categories as the user types.
- Recently viewed and "complete the kit" related products on the PDP.

## A7. 3D system

**Architecture**
- A `SceneManager` module owns one shared `WebGLRenderer`. Prefer one fixed canvas with scissored views that track DOM elements. Never keep more than two WebGL contexts alive on a page.
- The 3D bundle is loaded with dynamic `import()` only after the page is interactive: on `requestIdleCallback` after `load`, or when a 3D section approaches the viewport, whichever comes later.
- Every 3D area first shows a server-rendered poster image at the exact same size. The canvas fades in over it only once the first frame has rendered. The poster, not the canvas, is the LCP element.
- Render on demand. Pause when the section is off-screen (IntersectionObserver) and when the tab is hidden. Cap device pixel ratio at 2 on desktop and 1.5 on mobile.
- Dispose geometries, materials and textures when a scene is torn down. Handle `webglcontextlost` by falling back to the poster.

**Quality tiers**
- Decide a tier on load from GPU tier, `deviceMemory`, `hardwareConcurrency`, `Save-Data` and `prefers-reduced-motion`: `high`, `medium`, `low`, `off`.
- `high`: full shaders, particles, post-processing if it holds 60 fps.
- `medium`: simpler shaders, fewer particles, no post-processing.
- `low`: static lighting, no particles, CSS effects for cards.
- `off`: posters and CSS only.
- Monitor frame time at runtime and step down a tier if the average drops below 45 fps on desktop or 30 fps on mobile.

**Scenes**

1. **Home hero, "Water Line".** A procedural ocean surface (Gerstner waves, fresnel, foam, light caustics) with GPU-instanced spray particles. A hero product floats above the water and turns slowly. The camera moves along a scroll-driven timeline through three beats: wide water shot, product close-up, hand-off into the category section. Pointer movement adds subtle parallax. If no GLB exists, show the product as a cut-out image on a plane with depth-map parallax; the water and spray are procedural and need no model.

2. **Product cards.** On hover: a 3D tilt that follows the pointer, a light sweep, and a WebGL water-ripple transition from the primary image to the secondary image. Rendered through the shared renderer. On `low` and `off` tiers use CSS transforms and a crossfade.

3. **PDP viewer.**
   - With a GLB: damped orbit with limited angles and zoom, auto-rotate until the user interacts, studio-style environment lighting, contact shadow.
   - Colorway switching: choosing a color variation swaps materials or textures with an animated wipe, and updates the page `--accent`.
   - Hotspots: HTML labels anchored to 3D positions; clicking one moves the camera and opens the feature text.
   - Exploded view when the model has named parts (useful for boots and goggles).
   - Without a GLB: an image gallery with WebGL depth parallax and smooth zoom, and a 360 spin if a frame sequence is supplied.

4. **Category headers.** A light caustics shader tinted with the category accent behind the category title.

5. **Footer.** An animated wave line. Shader on `high` and `medium`, CSS or SVG otherwise.

**Model pipeline**
- `npm run models` runs `gltf-transform` over `assets-source/models/` and writes optimized files to the theme: Meshopt or Draco geometry, resized KTX2 or WebP textures, unused data pruned.
- The script fails when a model breaks a budget: 1.5 MB per GLB after compression, 100k triangles, 2048 px textures for the hero model and 1024 px for others.
- Decoders (Draco, Basis, Meshopt) are self-hosted and loaded only when a model needs them.

## A8. Animation system

Build one small motion library in the theme (`src/motion/`) and use it everywhere so behavior is consistent. Each animation is registered by a `data-` attribute on the HTML, initialized when it enters the viewport, and cleaned up on page hide.

**Required animations**

| Element | Animation |
|---|---|
| First visit | Preloader of at most 0.8 s, shown once per session, never blocking content that is already ready |
| Page change | Cross-document view transition; product image morphs from card to PDP |
| Header | Hide and reveal on scroll; background blur fades in after the first 80 px |
| Mega menu | Panel wipes down, links stagger in, featured product preview crossfades and tilts on category hover; closes instantly on Escape |
| Mobile menu | Full-screen wipe, staggered items, animated accordion |
| Nav links | Underline draw on hover and focus |
| Buttons | Magnetic pull on desktop pointer, water-fill hover, press scale |
| Cursor | Custom follower on desktop only, that changes state over links, products and the 3D viewer |
| Headings | SplitText line and character reveals on scroll |
| Images | Clip-path reveal with slight scale settle |
| Sections | Scroll-linked parallax and pinned storytelling sections, at most two pinned sections per page |
| Product grid | Staggered card entrance; GSAP Flip when filters or sort change |
| Filters | Animated chips, drawer slide on mobile, live result count ticking |
| Product card | 3D tilt, ripple image swap, quick-add sizes slide up |
| Add to cart | Product image flies to the cart icon, count bumps, cart drawer slides in |
| Cart drawer | Slide and backdrop fade; line items animate in, out and on quantity change |
| Search overlay | Expands from the search icon; results stagger in |
| PDP | Gallery transitions, variation swatch selection, accordion details, sticky buy bar sliding in after the main button leaves view |
| Size guide | Modal with animated measurement diagram |
| Numbers | Count-up for stats |
| Marquee | Velocity-reactive scrolling text band |
| Forms | Floating labels, inline validation shake, success check draw |
| Toasts | Slide and fade notifications |
| Footer | Wave line, staggered link columns |
| 404 | A playful water scene with a clear route back to the shop |

**Rules**
- Animate only `transform`, `opacity`, `clip-path` and `filter`. Never animate layout properties.
- Nothing shifts layout after it appears. Reserve space for everything.
- Input is never blocked by an animation. Menus, cart and search respond on the first interaction and can be interrupted.
- Content is visible by default in HTML and CSS. JavaScript sets the hidden start state just before animating, so a script failure never leaves content invisible.
- `prefers-reduced-motion: reduce` replaces all movement with short fades, disables smooth scroll, parallax, pinning, the custom cursor and auto-rotation.
- Checkout and account pages get subtle transitions only.

## A9. Page specifications

**Home**
1. Hero "Water Line" 3D scene with headline, one line of supporting copy and a "Shop gear" button.
2. Category rail: large cards for the main categories, horizontally scrollable on mobile.
3. Featured collection: pinned scroll section that walks through one wetsuit series and its colorways.
4. Best sellers grid.
5. "Built for racing" story band with technology callouts and the race team.
6. Kit builder strip: wetsuit + boots + gloves + goggles shown as one outfit with links to each.
7. Dealer and support links, newsletter signup, footer.

**Category / Shop listing**
- Caustics header with title and short description, breadcrumb, filter bar, product grid, load-more with a paginated fallback for crawlers.

**Product detail**
- Left: 3D viewer or gallery. Right: title, price, rating if present, color swatches, size selector with size guide link, stock state, add to cart, shipping and returns summary.
- Below: feature hotspots list, description, specs table, sizing, care, related products, recently viewed.
- Sticky buy bar on scroll, with selected variation shown.
- Full WooCommerce Product structured data.

**Cart drawer and cart page**
- Line items with image, variation, quantity stepper, remove with undo, subtotal, free-shipping progress bar only if the store has such a threshold, checkout button.

**Size Guide, About / Race Team, Dealers, Support**
- Editable in the WordPress block editor using a small set of custom blocks or patterns from the theme: hero, text and media, stats, team grid, FAQ accordion, dealer list, contact form.

## A10. Performance budget (hard limits)

Measure on mobile emulation with 4x CPU slowdown and slow 4G, on Home, a category page and a product page.

| Metric | Limit |
|---|---|
| Largest Contentful Paint | 1.8 s or less |
| Interaction to Next Paint | 200 ms or less |
| Cumulative Layout Shift | 0.05 or less |
| Total Blocking Time | 150 ms or less |
| Lighthouse Performance (mobile) | 90 or higher |
| Lighthouse Accessibility, Best Practices, SEO | 95 or higher |
| JavaScript before interaction (gzip) | 90 KB or less, excluding WooCommerce's own scripts |
| CSS (gzip) | 35 KB or less, critical CSS 14 KB or less |
| Initial page weight | 900 KB or less |
| 3D bundle | Lazy-loaded, never in the initial request chain |
| Frame rate | 60 fps desktop, 30 fps or more on mid-range mobile |

**Required techniques**
- Server-render all content. The LCP element is an `<img>` with `fetchpriority="high"`, never a canvas, video or background image.
- Lazy-load below-the-fold images and all video. Give every image explicit dimensions and a dominant-color placeholder.
- `defer` or `type="module"` on all scripts. No render-blocking third-party resources. No third-party scripts at all until I approve them.
- Preconnect and preload only what the first view needs.
- Long tasks over 50 ms are split with `scheduler.yield()` or idle callbacks.
- Friendly to full-page caching: no per-user HTML for logged-out visitors. Cart count and other personal fragments load client-side from the Store API.
- Long cache lifetimes for hashed assets.
- Speculation Rules prerender plus view transitions so in-site navigation feels instant.

## A11. Accessibility, SEO and resilience

- WCAG 2.2 AA: full keyboard support, visible focus styles, correct landmarks and headings, color contrast, focus trapping in menu, drawer, search and modals, with focus returned on close.
- Mega menu follows the disclosure navigation pattern and works with keyboard and screen readers.
- Decorative canvases are `aria-hidden`. The PDP viewer has a text alternative and keyboard controls for rotate and zoom.
- All text is real HTML text. Clean heading order, descriptive alt text from product data, canonical URLs, Open Graph tags, XML sitemap, Product and Breadcrumb structured data.
- The store works with JavaScript disabled: navigation, product pages, add to cart and checkout.
- Tested in current Chrome, Safari, Firefox and Edge, plus iOS Safari and Android Chrome. Features without support (view transitions, speculation rules, WebGL2) degrade silently.

## A12. Project structure

```
/
  BRIEF.md
  DECISIONS.md            # short log of choices and trade-offs
  .wp-env.json
  package.json
  assets-source/          # raw inputs, not shipped
    brand/  products/  models/  photos/
  scripts/
    import-products/
    optimize-models/
  tests/
    e2e/                  # Playwright
    lighthouse/           # Lighthouse CI config and budgets
  wp-content/themes/jettribe/
    functions.php
    theme.json
    inc/                  # enqueue, woo setup, meta fields, speculation rules, store-api helpers
    templates/  parts/  woocommerce/
    blocks/  patterns/
    src/
      styles/
      motion/             # shared animation library
      three/              # SceneManager, tiers, scenes, loaders
      features/           # menu, search, cart, filters, pdp
      entries/            # per-route entry points
    dist/                 # built assets + manifest
```

## A13. Working rules for you, the agent

- Plan before coding. At the start of each phase, list the tasks and files, then proceed.
- Work in small commits with clear messages. Keep `DECISIONS.md` updated.
- Follow WordPress coding standards. Escape all output, sanitize all input, use nonces and capability checks on anything that writes.
- Before adding any dependency, state its gzipped size and why it is needed.
- Check current official docs for WordPress, WooCommerce Store API, three.js and GSAP instead of relying on memory when an API detail matters.
- After each phase: run the build, linters, Playwright tests and Lighthouse CI, then report the actual numbers against A10. A phase is not done while a budget fails. If a budget cannot be met, explain why and propose options instead of quietly lowering quality or the budget.
- Never invent product data, reviews, awards or claims.
- Ask me before: installing plugins, changing the stack, deleting data, or anything that affects a live site.
- When something in this brief is ambiguous, choose the option that best serves A2's priority order, note it in `DECISIONS.md`, and continue.

---

# PART B: PHASE PROMPTS

Paste one at a time. Review the result before moving on.

## Phase 0: Kickoff (no code yet)

```
Read BRIEF.md in full. Do not write any site code yet.

1. Summarize the project back to me in 10 bullet points or fewer.
2. Inspect assets-source/ and tell me exactly what is there and what is missing
   (brand files, product export, models, photos).
3. Create a project rules file for this repo that captures sections A2, A3, A8 rules,
   A10 and A13 so they apply to every future request.
4. Write PLAN.md with the tasks for Phases 1 to 8, the files each will touch,
   and the risks you see.
5. List any questions that would change the plan. If there are none, say so.

Stop after this and wait for my go-ahead.
```

## Phase 1: Environment, theme scaffold, build pipeline

```
Follow BRIEF.md. Do Phase 1 only.

- Set up @wordpress/env with the latest stable WordPress and WooCommerce, pretty
  permalinks, and WooCommerce's basic store settings.
- Scaffold the `jettribe` theme with the structure in A12, theme.json tokens from A4,
  and Vite + TypeScript with a PHP manifest loader for hashed assets.
- Build the base templates with semantic HTML and no animation: header, footer,
  front page, generic page, 404.
- Add linting (PHP, TS, CSS), Playwright with one smoke test per template, and
  Lighthouse CI with the A10 budgets.
- Inline critical CSS and load the rest non-blocking.

Finish by running everything and reporting Lighthouse numbers for the home page.
```

## Phase 2: Products and store templates (still no animation)

```
Follow BRIEF.md. Do Phase 2 only.

- Inspect the product export in assets-source/products/ and build the import script
  described in A5. If there is no export, create the labeled placeholder products.
- Create the category tree, confirming it against the real data.
- Add the "3D" product fields from A5.
- Build static, fast versions of: shop and category listing with URL-based filters and
  sort, product detail page, cart page, and styled checkout and account pages.
- Build the mini-cart drawer, add to cart and predictive search on the Store API,
  functional but unanimated.
- Make the store fully usable with JavaScript disabled.

This phase is the performance baseline. Report Lighthouse numbers for home, one
category page and one product page, and fix anything over budget before stopping.
```

## Phase 3: Motion foundation and navigation

```
Follow BRIEF.md. Do Phase 3 only.

- Build the shared motion library in src/motion/ with the rules in A8, including
  the reduced-motion path.
- Add Lenis synced to GSAP.
- Implement cross-document view transitions, including the product image morph
  from card to product page.
- Configure speculative loading for prerender as described in A3, with the
  exclusions, and handle document.prerendering correctly.
- Animate: header, desktop mega menu, mobile menu, nav links, buttons, search
  overlay, cart drawer, add-to-cart fly animation, toasts.
- Verify keyboard and screen reader behavior for menu, search and cart.

Report Lighthouse and INP results. Animation must not have moved any A10 number
past its limit.
```

## Phase 4: 3D foundation and the home hero

```
Follow BRIEF.md. Do Phase 4 only.

- Build src/three/: SceneManager with the shared renderer, quality tiers, runtime
  frame-rate monitor, lazy loading, poster-to-canvas handoff, pause and dispose
  logic, and context-loss fallback (A7).
- Build the model pipeline script and budgets.
- Build the "Water Line" home hero: procedural ocean, spray particles, floating
  hero product (GLB if present, otherwise the depth-parallax image fallback), and
  the three-beat scroll camera timeline.
- Confirm the hero poster image is the LCP element and that the 3D bundle is not
  in the initial request chain.

Report: LCP element and time, 3D bundle size, time until first 3D frame, and frame
rate on each quality tier.
```

## Phase 5: Product 3D

```
Follow BRIEF.md. Do Phase 5 only.

- Product cards: pointer tilt, light sweep and ripple image swap through the shared
  renderer, with the CSS fallback for low tiers.
- Product page viewer: orbit, colorway switching tied to the color variation,
  hotspots from product meta, exploded view when parts are named, and the no-model
  gallery fallback with depth parallax and zoom.
- Keyboard controls and text alternative for the viewer.
- Sticky buy bar and variation selection animations.

Test with one product that has a GLB and one that does not. Report product page
Lighthouse numbers for both.
```

## Phase 6: Remaining pages and details

```
Follow BRIEF.md. Do Phase 6 only.

- Finish the home page sections in A9.
- Category caustics headers, product grid entrances, Flip animations on filter and
  sort, filter chips and mobile filter drawer.
- Build the theme blocks or patterns for Size Guide, About / Race Team, Dealers and
  Support, and assemble those pages.
- Remaining items from the A8 table: headings, image reveals, marquee, count-ups,
  forms, size guide modal, footer wave, 404 scene, session preloader, desktop cursor.

Walk through the A8 table row by row and confirm each one is implemented, with its
reduced-motion behavior.
```

## Phase 7: Performance pass

```
Follow BRIEF.md. Do Phase 7 only. Add no features.

- Profile home, a category page and a product page on mobile emulation
  (4x CPU slowdown, slow 4G). Find and fix the biggest costs.
- Audit bundles: remove unused code, confirm route and feature splitting,
  check every dependency's size.
- Audit images, fonts, preloads, caching headers and WooCommerce script loading.
- Verify prerender and view transitions work and that back/forward cache is not
  blocked.
- Check memory: navigate 20 pages with 3D active and confirm no leaks.

Give me a before-and-after table for every metric in A10, per page.
```

## Phase 8: QA and launch readiness

```
Follow BRIEF.md. Do Phase 8 only.

- Cross-browser and device testing per A11. List anything that degrades and how.
- Full accessibility pass against WCAG 2.2 AA with fixes.
- SEO checks: structured data validation, sitemap, canonicals, meta, Open Graph.
- Test the full purchase flow, including variations, coupons, and failure states.
- Security review of every custom endpoint, form and meta field.
- Write README.md: local setup, build, product import, adding a 3D model to a
  product, and a production launch checklist covering page cache, CDN, object
  cache, image formats and SSL.

Finish with a list of everything still marked PLACEHOLDER.
```

---

# PART C: WHAT TO PUT IN `assets-source/`

Cursor writes the code. It cannot produce these, so the result depends on them.

| Folder | What | Notes |
|---|---|---|
| `brand/` | Logo as SVG, brand colors, fonts if licensed | Without these the defaults in A4 are used |
| `products/` | Full product export (CSV) from the current store, with variations, SKUs, prices, categories and image URLs | Without it only labeled placeholders are built |
| `photos/` | High-resolution product photos on transparent or plain backgrounds, plus lifestyle and race photos | Cut-out PNGs make the no-model 3D fallbacks look far better |
| `models/` | GLB models of key products | Start with 3 to 5 heroes: one wetsuit set, the race boot, a glove, goggles. Sources: a 3D artist, photogrammetry scans, or the factory's CAD or pattern files |

Products without a model still get the animated gallery, tilt and ripple effects, so the site can launch with a few models and add more over time.
