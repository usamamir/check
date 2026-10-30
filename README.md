# Jettribe Shopify theme

The uploadable theme is `jettribe-shopify-theme.zip`. Source files are in `jettribe-shopify/`. Upload steps and the payment setup are in `jettribe-shopify/UPLOAD.md`.

`jettribe-full-upload.zip` contains the theme zip, `jettribe-products.csv`, and `jettribe-all-categories.csv`. Import the product CSV first with overwrite unchecked. Then import `jettribe-all-categories.csv` once with overwrite checked. That one file puts every jettribe.com category on the product (Ride Gear 249, Outlet 254, and the rest) and includes each product’s existing size options so Shopify can update variants. Prices and photos are left unchanged. `jettribe-category-membership.csv` is the one-step collection membership file for the Matrixify app. The clickable preview in `preview/` uses the same catalog.
