import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { useFavourites } from "@/state/FavouritesContext";

export function FavouritesPage() {
  const { ids } = useFavourites();
  const list = products.filter((p) => ids.includes(p.slug));

  return (
    <div className="container" style={{ padding: "28px 0 64px" }}>
      <h1 style={{ fontSize: 56, marginBottom: 20 }}>Favourites</h1>
      {!list.length ? (
        <>
          <p style={{ color: "var(--jt-muted)" }}>Save products with the heart icon.</p>
          <Link className="btn btn-primary" to="/shop/best-sellers">
            Browse products
          </Link>
        </>
      ) : (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
