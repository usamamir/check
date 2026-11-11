import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import {
  effectivePrice,
  formatMoney,
  getProduct,
  isOnSale,
  relatedProducts,
} from "@/data/products";
import { useCart } from "@/state/CartContext";
import { useFavourites } from "@/state/FavouritesContext";
import { IconHeart } from "@/components/Icons";
import "@/styles/shop.css";

export function ProductPage() {
  const { slug = "" } = useParams();
  const product = getProduct(slug);
  const { addItem } = useCart();
  const { has, toggle } = useFavourites();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string>("");
  const [warn, setWarn] = useState(false);

  const related = useMemo(
    () => (product ? relatedProducts(product, 8) : []),
    [product],
  );

  if (!product) {
    return (
      <div className="container content-page">
        <h1>Product not found</h1>
        <Link to="/shop/best-sellers">Back to shop</Link>
      </div>
    );
  }

  const images = product.images.length ? product.images : product.image ? [product.image] : [];
  const sale = isOnSale(product);
  const price = effectivePrice(product);
  const sizes = product.sizes.length
    ? product.sizes
    : ["XS", "S", "M", "L", "XL", "2XL"];

  const add = () => {
    if (!size && product.sizes.length) {
      setWarn(true);
      return;
    }
    setWarn(false);
    addItem(product, size || undefined);
  };

  return (
    <div className="container">
      <div className="pdp">
        <div className="pdp-gallery">
          <div className="thumb-col">
            {images.map((src, i) => (
              <button
                type="button"
                key={src}
                className={i === active ? "active" : ""}
                onClick={() => setActive(i)}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="main-shot">
            {images[active] && (
              <img src={images[active]} alt={product.name} />
            )}
            <button type="button" className="btn btn-outline" style={{ marginTop: 12 }} disabled>
              View in 3D
            </button>
            <p style={{ fontSize: 12, color: "var(--jt-muted)" }}>
              3D viewer activates when a `.glb` model is uploaded in WordPress.
            </p>
          </div>
        </div>

        <div className="pdp-info">
          {sale && <div className="label">Sale</div>}
          <h1>{product.name}</h1>
          <p style={{ color: "var(--jt-muted)", marginTop: 0 }}>
            {product.categories[0] || "Jettribe"}
            {product.sku ? ` · SKU ${product.sku}` : ""}
          </p>
          <p className="price" style={{ fontSize: 18 }}>
            {sale ? (
              <>
                <span className="price-sale">{formatMoney(price)}</span>
                <span className="price-was">{formatMoney(product.price)}</span>
              </>
            ) : (
              formatMoney(price)
            )}
          </p>

          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Select Size</strong>
              <Link to="/size-chart" style={{ color: "var(--jt-muted)", fontSize: 13 }}>
                Size Guide
              </Link>
            </div>
            <div className={`size-grid ${warn ? "warn" : ""}`}>
              {sizes.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={size === s ? "selected" : ""}
                  onClick={() => {
                    setSize(s);
                    setWarn(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="size-msg">{warn ? "Please select a size." : ""}</div>
          </div>

          <div className="pdp-actions">
            <button type="button" className="btn btn-primary btn-block" onClick={add}>
              Add to Cart
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => toggle(product.slug)}
            >
              <IconHeart filled={has(product.slug)} size={16} /> Favourite
            </button>
          </div>

          <p style={{ fontSize: 13, color: "var(--jt-muted)" }}>
            Free USA shipping on orders $400+. {product.in_stock ? "In stock." : "Currently unavailable."}
          </p>
          {product.description && (
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{product.description}</p>
          )}

          <div className="accordion">
            <details>
              <summary>Size & Fit</summary>
              <p style={{ color: "var(--jt-muted)", fontSize: 14 }}>
                See the Size Chart for series-specific measurements. When in doubt, size up for layering.
              </p>
            </details>
            <details open>
              <summary>Features</summary>
              <p style={{ color: "var(--jt-muted)", fontSize: 14 }}>
                {product.description || "Feature details imported from the Jettribe catalog."}
              </p>
            </details>
            <details>
              <summary>Shipping & Returns</summary>
              <p style={{ color: "var(--jt-muted)", fontSize: 14 }}>
                Standard shipping timelines and return windows match Rider Support policies on the current store.
              </p>
            </details>
            <details>
              <summary>Reviews</summary>
              <p style={{ color: "var(--jt-muted)", fontSize: 14 }}>
                Reviews sync from the live store at launch — no placeholder ratings here.
              </p>
            </details>
          </div>
        </div>
      </div>

      <section style={{ paddingBottom: 48 }}>
        <div className="section-head">
          <h2 style={{ fontSize: 42 }}>You Might Also Like</h2>
        </div>
        <div className="product-grid">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <div className="mobile-sticky-cart">
        <button type="button" className="btn btn-primary btn-block" onClick={add}>
          Add to Cart · {formatMoney(price)}
        </button>
      </div>
    </div>
  );
}
