# Jettribe Shopify theme

Upload `jettribe-shopify-theme.zip` in Shopify admin under **Online Store → Themes → Add theme → Upload zip file**. The zip root already contains `layout`, `templates`, `sections`, `assets`, and `config`. Leave the zip closed. Publish the theme. Menu categories, including 2026 JTR Series, open from the theme and list imported products. Shopify does not have to contain that collection first. Color filters are circles.

This is a Shopify Online Store 2.0 theme matched to the live Jettribe storefront: black header, red announcement bar, blue prices, Oswald and Roboto type, the same homepage tiles and hero photos, the same menu, rider-support footer, wishlist, quick view, and payment marks for PayPal, Visa, Discover, Mastercard, and American Express.

BigCommerce Stencil files cannot run on Shopify. Checkout, payment processing, customer passwords, and the product catalog are store settings and data, not theme files.

## Payments

The footer, homepage, product page, and cart show PayPal, Visa, Discover, Mastercard, and American Express. The product page also shows the PayPal Pay Later line from the messages account already on jettribe.com. These marks do not turn processing on. In **Settings → Payments**:

- **Shopify Payments** for Visa, Mastercard, American Express, and Discover
- **PayPal**

If PayPal issues a new messages client id after the Shopify PayPal account is connected, replace the client id and merchant id under **Theme settings → Payments**. The loaded script is messages only.

Gift cards: create a gift card product with handle `gift-card`. The header link points at `/products/gift-card`.

Free USA shipping over $400 is a message in the theme. Create the matching free-shipping rate in **Settings → Shipping and delivery**.

## After upload

1. Publish the theme.
2. Import `jettribe-products.csv` in **Products → Import** with **Overwrite products with matching handles** checked. Upload the CSV itself. Do not open it in Excel. Saving it from Excel strips the size columns, and Shopify then reports “Product options input is required when updating variants.” This one file is the whole catalog: 541 products, photos, prices, size options, all 159 category tags, and the plate, name-plate, and sock add-ons (None, blank plate +$25, custom plate +$60, the $40 name plate, Lycra socks +$36.99). Variants that had no SKU, including the None plate choice, now carry that product's SKU. Re-import with Overwrite checked so those SKUs are stored on the variants. Do not import the older category sheets, `jettribe-all-categories.csv`, `jettribe-addon-prices.csv`, or `jettribe-category-membership.csv`. Those files are what the product importer rejected.
3. Create pages with these handles and leave the body empty. The theme already contains the current page copy and shows it until you paste a replacement: `shipping-info`, `return-policy`, `warranty-policy`, `privacy-policy`, `culture`, `legal-mumbo-jumbo`, `jettribe-logos`, `dropshipping`, `sponsorship`, `size-chart`, `wetsuit-return-instructions`, plus the 2025 catalog pages. `careers` and `hot-water-the-movie` still need copy pasted from the live site if you use those links.
4. Assign the **contact**, **financing**, and **customization** templates to pages with handles `contact`, `financing`, and `jettribe-customization-form`.
5. Create a blog with handle `news`.
6. In **Settings → Customer accounts**, choose classic accounts if the themed sign-in, register, and order pages should be used.
7. In **Search & Discovery**, turn on collection filters (size, price, availability) so the collection sidebar matches the current store.
8. VIP Deals is on. Turn it off under **Theme settings → Navigation** when VIP is closed. Empty menu links, including empty Outlet items, stay hidden until **Show menu categories that have no products** is turned on.

The built-in Jettribe menu is on by default, including the links that only appear in the mobile menu. Switch **Theme settings → Navigation** to a Shopify menu after that menu is rebuilt. Photo fields on custom factory products upload a file with the order. Custom products show a made-to-order shipping note, and a rider number field is added when the product asks for a name or photo and does not already ask for a number. A letter option swaps the main photo when a product image is labeled with that letter.

Returns stay on `https://jettribe.returnscenter.com`. Wishlist is saved in the browser. Order history and saved cards move only with a separate customer and order migration.
