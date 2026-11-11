import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoUrl from "@assets/logo/jettribe-mark.png";
import {
  helpLinks,
  mainNav,
  promoMessages,
  utilityLeft,
  utilityRight,
} from "@/data/menu";
import { searchProducts } from "@/data/products";
import { useCart } from "@/state/CartContext";
import { useFavourites } from "@/state/FavouritesContext";
import {
  IconBag,
  IconChevron,
  IconClose,
  IconHeart,
  IconMenu,
  IconSearch,
} from "./Icons";
import "@/styles/header.css";

const popular = ["Wetsuits", "Impact Vest", "Gloves", "Goggles", "JTR", "Covers"];

export function Header() {
  const { count, lastAdded, dismissLastAdded } = useCart();
  const { ids } = useFavourites();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [promoIdx, setPromoIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerChild, setDrawerChild] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last && y > 80) setHidden(true);
      else setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setPromoIdx((i) => (i + 1) % promoMessages.length),
      4000,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!lastAdded) return;
    const t = window.setTimeout(dismissLastAdded, 4000);
    return () => window.clearTimeout(t);
  }, [lastAdded, dismissLastAdded]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, searchOpen]);

  const results = searchProducts(query, 12);

  return (
    <>
      <header className={`site-header ${hidden ? "is-hidden" : ""}`}>
        <div className="utility-bar">
          <div className="utility-cluster">
            {utilityLeft.map((l) => (
              <Link key={l.href} to={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="utility-cluster">
            {utilityRight.map((l) =>
              l.children ? (
                <div className="help-wrap" key={l.label}>
                  <button type="button">{l.label}</button>
                  <div className="help-menu">
                    {helpLinks.map((h) => (
                      <Link key={h.href} to={h.href}>
                        {h.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={l.href} to={l.href}>
                  {l.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="main-bar">
          <button
            type="button"
            className="icon-btn mobile-toggle"
            aria-label="Open menu"
            onClick={() => {
              setDrawerChild(null);
              setDrawerOpen(true);
            }}
          >
            <IconMenu />
          </button>

          <Link to="/" className="logo" aria-label="Jettribe home">
            <img src={logoUrl} alt="Jettribe" width={160} height={31} />
          </Link>

          <nav className="desktop-nav" aria-label="Primary">
            {mainNav.map((item) => (
              <div className="nav-item" key={item.label}>
                <Link className="nav-link" to={item.href}>
                  {item.label}
                </Link>
                <div className="mega" role="region" aria-label={`${item.label} menu`}>
                  {item.columns.map((col) => (
                    <div className="mega-col" key={col.heading}>
                      <h4>{col.heading}</h4>
                      {col.links.map((link) => (
                        <Link key={link.href + link.label} to={link.href}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="search-chip"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch size={16} /> Search
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch />
            </button>
            <Link className="icon-btn" to="/favourites" aria-label="Favourites">
              <IconHeart filled={ids.length > 0} />
            </Link>
            <Link className="icon-btn" to="/cart" aria-label="Cart">
              <IconBag />
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>

        <div className="promo-strip" aria-live="polite">
          <span className="promo-msg" key={promoIdx}>
            {promoMessages[promoIdx]}
          </span>
        </div>
      </header>

      <div
        className={`drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`mobile-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <strong>Menu</strong>
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
            <IconClose />
          </button>
        </div>
        <div className="drawer-panels">
          <div className={`drawer-panel root ${drawerChild != null ? "away" : ""}`}>
            {mainNav.map((item, idx) => (
              <button
                type="button"
                className="drawer-link"
                key={item.label}
                onClick={() => setDrawerChild(idx)}
              >
                {item.label}
                <IconChevron />
              </button>
            ))}
            <Link className="drawer-link" to="/vip" onClick={() => setDrawerOpen(false)}>
              Join VIP
            </Link>
            <Link className="drawer-link" to="/account" onClick={() => setDrawerOpen(false)}>
              Sign In
            </Link>
          </div>
          {drawerChild != null && (
            <div className="drawer-panel child open">
              <button type="button" className="drawer-back" onClick={() => setDrawerChild(null)}>
                <IconChevron dir="left" /> {mainNav[drawerChild].label}
              </button>
              {mainNav[drawerChild].columns.map((col) => (
                <div key={col.heading}>
                  <div className="drawer-link" style={{ color: "var(--jt-muted)", fontSize: 12 }}>
                    {col.heading}
                  </div>
                  {col.links.map((link) => (
                    <Link
                      key={link.href + link.label}
                      className="drawer-link"
                      to={link.href}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className={`search-overlay ${searchOpen ? "open" : ""}`} role="dialog" aria-label="Search">
        <div className="search-top">
          <IconSearch />
          <input
            autoFocus={searchOpen}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Jettribe"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter" && query.trim()) {
                setSearchOpen(false);
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
          <button type="button" className="icon-btn" aria-label="Close search" onClick={() => setSearchOpen(false)}>
            <IconClose />
          </button>
        </div>
        <div className="search-body">
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Popular Searches
          </div>
          <div className="chip-row">
            {popular.map((p) => (
              <button
                type="button"
                className="chip"
                key={p}
                onClick={() => setQuery(p)}
              >
                {p}
              </button>
            ))}
          </div>
          {query.trim() && (
            <>
              <div style={{ marginBottom: 12, color: "var(--jt-muted)" }}>
                {results.length} results for “{query}”
              </div>
              <div className="search-results">
                {results.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/product/${p.slug}`}
                    onClick={() => setSearchOpen(false)}
                    style={{ display: "grid", gap: 8 }}
                  >
                    <div style={{ background: "var(--jt-surface)", aspectRatio: "1", display: "grid", placeItems: "center" }}>
                      {p.image && <img src={p.image} alt="" loading="lazy" style={{ maxHeight: "100%", objectFit: "contain" }} />}
                    </div>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lastAdded && (
        <div className="added-panel" role="status">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Added to Cart</div>
          <div className="added-panel-row">
            {lastAdded.product.image && <img src={lastAdded.product.image} alt="" />}
            <div>
              <div style={{ fontSize: 14 }}>{lastAdded.product.name}</div>
              {lastAdded.size && (
                <div style={{ color: "var(--jt-muted)", fontSize: 13 }}>Size: {lastAdded.size}</div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn btn-outline" to="/cart" onClick={dismissLastAdded} style={{ flex: 1 }}>
              View Cart
            </Link>
            <Link className="btn btn-primary" to="/checkout" onClick={dismissLastAdded} style={{ flex: 1 }}>
              Checkout
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
