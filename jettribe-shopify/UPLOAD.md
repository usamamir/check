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
2. Import `jettribe-products.csv` in **Products → Import**. It has all 539 live products: titles, prices, photos, descriptions, size options, and the open text fields used for vest name plates and race numbers (stored as `text-option:` tags). The Collection column places each product in its main department, and Shopify creates that collection on import (`Wetsuits`, `Jettribe Vests`, `Accessories`, and the other homepage categories). A product CSV can name only one collection per product, so subcategory pages stay empty until those products are added in **Products → Collections**. `jettribe-collections.csv` is the full map of every category a product belongs to.
3. Create pages with these handles and leave the body empty. The theme already contains the current page copy and shows it until you paste a replacement: `shipping-info`, `return-policy`, `warranty-policy`, `privacy-policy`, `culture`, `legal-mumbo-jumbo`, `jettribe-logos`, `dropshipping`, `sponsorship`, `size-chart`, `wetsuit-return-instructions`, plus the 2025 catalog pages. `careers` and `hot-water-the-movie` still need copy pasted from the live site if you use those links.
4. Assign the **contact**, **financing**, and **customization** templates to pages with handles `contact`, `financing`, and `jettribe-customization-form`.
5. Create a blog with handle `news`.
6. In **Settings → Customer accounts**, choose classic accounts if the themed sign-in, register, and order pages should be used.
7. In **Search & Discovery**, turn on collection filters (size, price, availability) so the collection sidebar matches the current store.

The built-in Jettribe menu is on by default, including the links that only appear in the mobile menu. Switch **Theme settings → Navigation** to a Shopify menu after that menu is rebuilt.

Returns stay on `https://jettribe.returnscenter.com`. Wishlist is saved in the browser. Order history and saved cards move only with a separate customer and order migration.
