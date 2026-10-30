# Jettribe Shopify theme

Upload `jettribe-shopify-theme.zip` in Shopify admin under **Online Store → Themes → Add theme → Upload zip file**. The zip root already contains `layout`, `templates`, `sections`, `assets`, and `config`.

This is a Shopify Online Store 2.0 theme matched to the live Jettribe storefront: black header, red announcement bar, blue prices, Oswald and Roboto type, the same homepage tiles and hero photos, the same menu, rider-support footer, wishlist, quick view, and the same payment marks (PayPal, Visa, Discover, Mastercard, American Express, Klarna, and Bread).

BigCommerce Stencil files cannot run on Shopify. Checkout, payment processing, customer passwords, and the product catalog are store settings and data, not theme files.

## Payments

The theme shows the payment marks and accelerated-checkout buttons. Turn the processors on in **Settings → Payments**:

- **Shopify Payments** for Visa, Mastercard, American Express, Discover, Shop Pay, Apple Pay, and Google Pay
- **PayPal**
- **Klarna** (paste the Klarna on-site messaging client id into **Theme settings → Payments** to restore the live placement used on jettribe.com)
- **Bread** by installing the Bread Shopify app, then paste the application link into the Financing page section

Gift cards: create a gift card product with handle `gift-card`. The header link points at `/products/gift-card`.

Free USA shipping over $400 is a message in the theme. Create the matching free-shipping rate in **Settings → Shipping and delivery**.

## After upload

1. Publish the theme.
2. Import `jettribe-products.csv` in **Products → Import**. It has the live products: titles, prices, photos, descriptions, size options, and the open text fields used for vest name plates and race numbers (stored as `text-option:` tags). Leave **Overwrite products with matching handles** unchecked the first time. If you already imported it, import it once more with overwrite unchecked so the two products added later are created and the rest are left alone.
3. Import `jettribe-all-categories.csv` once in **Products → Import**, with **Overwrite products with matching handles** checked. This single file replaces the old 20 category sheets. Upload the CSV itself. Saving it from Excel again strips the size columns, and Shopify then reports “Product options input is required when updating variants.” Every row includes the product’s existing size or option values. Prices and photos are not in the file, so they stay as they are. Each jettribe.com category is stored as a tag such as `collection:ride-gear` (249 products) and `collection:outlet` (254 products). Shopify’s product importer keeps only one collection name per file, so the tags are what let every category go up in one upload. A category page lists those products when its condition is **Product tag is equal to** `collection:` plus the handle. Collections already created by an earlier import keep the products already in them when that condition is added. To place every product into all 159 categories in one step, import `jettribe-category-membership.csv` in the Matrixify app as **Collections**. Leave that file out of **Products → Import**. Matrixify’s free plan covers 10 collections per job; this file has 159, which fits the Basic plan. It adds the live category lists and does not remove products, prices, or photos.
4. Create pages with these handles and leave the body empty. The theme already contains the current page copy and shows it until you paste a replacement: `shipping-info`, `return-policy`, `warranty-policy`, `privacy-policy`, `culture`, `legal-mumbo-jumbo`, `jettribe-logos`, `dropshipping`, `sponsorship`, `size-chart`, `wetsuit-return-instructions`, plus the 2025 catalog pages. `careers` and `hot-water-the-movie` still need copy pasted from the live site if you use those links.
5. Assign the **contact**, **financing**, and **customization** templates to pages with handles `contact`, `financing`, and `jettribe-customization-form`.
6. Create a blog with handle `news`.
7. In **Settings → Customer accounts**, choose classic accounts if the themed sign-in, register, and order pages should be used.
8. In **Search & Discovery**, turn on collection filters (size, price, availability) so the collection sidebar matches the current store.

The built-in Jettribe menu is on by default, including the links that only appear in the mobile menu. Switch **Theme settings → Navigation** to a Shopify menu after that menu is rebuilt.

Returns stay on `https://jettribe.returnscenter.com`. Wishlist is saved in the browser. Order history and saved cards move only with a separate customer and order migration.
