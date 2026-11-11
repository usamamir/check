import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  type Product,
} from "@/data/products";
import { useFavourites } from "@/state/FavouritesContext";
import { IconHeart } from "./Icons";
import "@/styles/product-card.css";

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useFavourites();
  const [img, setImg] = useState(product.image);
  const cardRef = useRef<HTMLElement | null>(null);
  const fav = has(product.slug);
  const sale = isOnSale(product);
  const price = effectivePrice(product);

  const onMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
    setImg(product.image);
  };

  return (
    <article
      className="product-card"
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className={`fav-btn ${fav ? "on" : ""}`}
        aria-label={fav ? "Remove favourite" : "Favourite"}
        onClick={() => toggle(product.slug)}
      >
        <IconHeart filled={fav} size={18} />
      </button>
      <Link to={`/product/${product.slug}`} className="product-card-link">
        <div className="product-card-media">
          {img ? (
            <img src={img} alt={product.name} loading="lazy" width={500} height={500} />
          ) : (
            <div className="skeleton" style={{ width: "100%", height: "100%" }} />
          )}
          <div className="card-labels">
            {sale && <span className="badge badge-sale">Sale</span>}
            {/new/i.test(product.name) && <span className="badge">New</span>}
          </div>
        </div>
        <div className="product-card-body">
          <h3>{product.name}</h3>
          <p className="cat-line">
            {product.categories[0] || "Jettribe"}
            {product.images.length > 1 ? ` · ${product.images.length} Photos` : ""}
          </p>
          <p className="price">
            {sale ? (
              <>
                <span className="price-sale">{formatMoney(price)}</span>
                <span className="price-was">{formatMoney(product.price)}</span>
              </>
            ) : (
              formatMoney(price)
            )}
          </p>
        </div>
      </Link>
      {product.images.length > 1 && (
        <div className="color-thumbs" aria-hidden>
          {product.images.slice(0, 4).map((src) => (
            <button
              type="button"
              key={src}
              onMouseEnter={() => setImg(src)}
              onFocus={() => setImg(src)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
