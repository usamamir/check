import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import {
  categoryTitle,
  effectivePrice,
  isOnSale,
  productsInCategory,
  searchProducts,
  type Product,
} from "@/data/products";
import "@/styles/shop.css";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export function ShopPage({ mode = "category" }: { mode?: "category" | "search" }) {
  const { slug = "best-sellers" } = useParams();
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [hideFilters, setHideFilters] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [saleOnly, setSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Availability: true,
    Price: true,
  });

  const base = useMemo(() => {
    if (mode === "search") return searchProducts(q, 200);
    return productsInCategory(slug);
  }, [mode, q, slug]);

  const list = useMemo(() => {
    let items: Product[] = [...base];
    if (saleOnly) items = items.filter(isOnSale);
    if (inStockOnly) items = items.filter((p) => p.in_stock);
    items.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc")
        return (effectivePrice(a) ?? 0) - (effectivePrice(b) ?? 0);
      if (sort === "price-desc")
        return (effectivePrice(b) ?? 0) - (effectivePrice(a) ?? 0);
      return 0;
    });
    return items;
  }, [base, saleOnly, inStockOnly, sort]);

  const title = mode === "search" ? `Search: ${q || "All"}` : categoryTitle(slug);

  const Filters = (
    <div className="filters">
      {(
        [
          {
            name: "Availability",
            body: (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  In stock
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={saleOnly}
                    onChange={(e) => setSaleOnly(e.target.checked)}
                  />
                  Sale
                </label>
              </>
            ),
          },
          {
            name: "Price",
            body: (
              <div style={{ fontSize: 13, color: "var(--jt-muted)" }}>
                Sorted via toolbar. Live price buckets arrive with WooCommerce filters on launch.
              </div>
            ),
          },
          {
            name: "Color",
            body: (
              <div className="swatches" aria-hidden>
                {["#111", "#e04040", "#4050e8", "#f5f5f5", "#2f6b4f", "#f0c14a"].map((c) => (
                  <span key={c} className="swatch" style={{ background: c }} />
                ))}
              </div>
            ),
          },
        ] as const
      ).map((g) => (
        <div className="filter-group" key={g.name}>
          <button
            type="button"
            className="head"
            onClick={() =>
              setOpenGroups((s) => ({ ...s, [g.name]: !s[g.name] }))
            }
          >
            {g.name}
            <span>{openGroups[g.name] ? "−" : "+"}</span>
          </button>
          {openGroups[g.name] && <div className="filter-options">{g.body}</div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="container">
      <div className="shop-toolbar">
        <h1>
          {title}
          <span className="count">({list.length})</span>
        </h1>
        <div className="toolbar-actions">
          <button type="button" onClick={() => setHideFilters((v) => !v)} className="desktop-only">
            {hideFilters ? "Show Filters" : "Hide Filters"}
          </button>
          <button type="button" onClick={() => setSheetOpen(true)} className="mobile-only">
            Filters
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort By
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="featured">Sort By: Featured</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="shop-layout">
        {!hideFilters && <aside className="filters desktop">{Filters}</aside>}
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
          {!list.length && (
            <p style={{ gridColumn: "1 / -1", color: "var(--jt-muted)" }}>
              No products matched. Try another category or search.
            </p>
          )}
        </div>
      </div>

      <div className={`filters-sheet ${sheetOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <strong>Filters</strong>
          <button type="button" onClick={() => setSheetOpen(false)}>
            Close
          </button>
        </div>
        {Filters}
        <button className="btn btn-primary btn-block" type="button" onClick={() => setSheetOpen(false)}>
          View Results ({list.length})
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 901px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
