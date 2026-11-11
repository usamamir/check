import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Hero3D } from "@/components/Hero3D";
import { ProductCard } from "@/components/ProductCard";
import { shopByCategory } from "@/data/menu";
import {
  bestSellers,
  categoryThumb,
  meta,
  products,
} from "@/data/products";
import { useReveal } from "@/hooks/useReveal";
import "@/styles/home.css";

const heroes = [
  {
    image: "/heroes/hero-1.jpg",
    brand: "Jettribe",
    title: "2026 JTR Series",
    text: "Race-bred wetsuits and kits for riders who live on the water.",
    cta: [
      { label: "Shop", href: "/shop/2026-jtr-series" },
      { label: "Explore", href: "/shop/new-arrivals" },
    ],
  },
  {
    image: "/heroes/hero-2.jpg",
    brand: "Jettribe",
    title: "Impact Ready",
    text: "Competition and Coast Guard vests built for hard landings.",
    cta: [
      { label: "Shop Vests", href: "/shop/vests-competition" },
      { label: "Size Chart", href: "/size-chart" },
    ],
  },
  {
    image: "/heroes/hero-3.jpg",
    brand: "Jettribe",
    title: "Custom Gear",
    text: "Design your kit — colors, name, and race number.",
    cta: [
      { label: "Build", href: "/custom-gear-builder" },
      { label: "Factory Custom", href: "/shop/customized-gear-factory" },
    ],
  },
];

const promoBanners = [
  {
    title: "Newest Series",
    text: "Fresh colorways for the 2026 season.",
    href: "/shop/2026-jtr-series",
    image: "/heroes/hero-4.jpg",
  },
  {
    title: "Vests",
    text: "Side-entry impact protection for ride and race.",
    href: "/shop/vests-competition",
    image: "/heroes/hero-5.jpg",
  },
  {
    title: "Custom Gear Builder",
    text: "Dial in every zone. Own the start line.",
    href: "/custom-gear-builder",
    image: "/heroes/hero-1.jpg",
  },
];

const videos = [
  {
    id: "dQw", // placeholder replaced with real Jettribe YT if known
    title: "Jettribe on the water",
    thumb: "/heroes/hero-2.jpg",
    url: "https://www.youtube.com/results?search_query=jettribe+pwc",
  },
];

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <section className={`section reveal ${className}`} ref={ref}>
      {children}
    </section>
  );
}

export function HomePage() {
  const [slide, setSlide] = useState(0);
  const [vipEmail, setVipEmail] = useState("");
  const [vipDone, setVipDone] = useState(false);
  const [activeVideo, setActiveVideo] = useState(false);
  const sellers = useMemo(() => bestSellers(12), []);
  const floatProduct = products.find((p) => /wetsuit|vest|jtr/i.test(p.name) && p.image)?.image;

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % heroes.length), 6500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = "Jettribe | Ride & Race Gear";
  }, []);

  return (
    <div>
      <section className="hero" aria-label="Featured">
        {heroes.map((h, i) => (
          <div className={`hero-slide ${i === slide ? "active" : ""}`} key={h.title}>
            <img src={h.image} alt="" fetchPriority={i === 0 ? "high" : "low"} />
          </div>
        ))}
        {slide === 0 && floatProduct && <Hero3D image={floatProduct} />}
        <div className="hero-copy container">
          <div className="brand">{heroes[slide].brand}</div>
          <h1>{heroes[slide].title}</h1>
          <p>{heroes[slide].text}</p>
          <div className="hero-actions">
            {heroes[slide].cta.map((c) => (
              <Link
                key={c.href}
                to={c.href}
                className={`btn ${c === heroes[slide].cta[0] ? "btn-light" : "btn-outline"}`}
                style={c !== heroes[slide].cta[0] ? { borderColor: "#fff", color: "#fff" } : undefined}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hero-controls">
          <button type="button" aria-label="Previous" onClick={() => setSlide((s) => (s + heroes.length - 1) % heroes.length)}>
            ‹
          </button>
          <span>
            {slide + 1} / {heroes.length}
          </span>
          <button type="button" aria-label="Next" onClick={() => setSlide((s) => (s + 1) % heroes.length)}>
            ›
          </button>
        </div>
      </section>

      <div className="promo-stack">
        {promoBanners.map((b) => (
          <Link to={b.href} className="promo-banner reveal is-visible" key={b.title}>
            <img src={b.image} alt="" loading="lazy" />
            <div className="inner">
              <h2>{b.title}</h2>
              <p>{b.text}</p>
              <span className="btn btn-light" style={{ marginTop: 12 }}>
                Shop
              </span>
            </div>
          </Link>
        ))}
      </div>

      <RevealSection>
        <div className="container">
          <div className="section-head">
            <h2>Shop by Category</h2>
          </div>
          <div className="h-scroll">
            {shopByCategory.map((c) => {
              const thumb = categoryThumb(c.href.replace("/shop/", ""));
              return (
                <Link to={c.href} className="cat-card" key={c.label}>
                  {thumb && <img src={thumb} alt="" loading="lazy" />}
                  <span>{c.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection>
        <div className="container">
          <div className="section-head">
            <h2>Best Sellers</h2>
            <Link to="/shop/best-sellers">Shop all</Link>
          </div>
          <div className="h-scroll" style={{ gridAutoColumns: "minmax(220px, 260px)" }}>
            {sellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection>
        <div className="container">
          <div className="section-head">
            <h2>Shop Covers by Brand</h2>
          </div>
          <div className="h-scroll">
            {[
              { label: "Sea-Doo", href: "/shop/sea-doo-covers" },
              { label: "Yamaha", href: "/shop/yamaha-covers" },
              { label: "Kawasaki", href: "/shop/kawasaki-covers" },
            ].map((b) => (
              <Link to={b.href} className="cat-card" key={b.label}>
                {(categoryThumb(b.href.replace("/shop/", "")) || "/heroes/hero-3.jpg") && (
                  <img
                    src={categoryThumb(b.href.replace("/shop/", "")) || "/heroes/hero-3.jpg"}
                    alt=""
                    loading="lazy"
                  />
                )}
                <span>{b.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      <section className="race-band">
        <div className="container">
          <h2>Race Family</h2>
          <p style={{ maxWidth: 420, color: "#ddd" }}>
            From USA nationals to international grands prix — Jettribe riders show up ready.
          </p>
          <div className="hero-actions" style={{ marginTop: 20 }}>
            <Link to="/events" className="btn btn-light">
              Events
            </Link>
            <Link to="/sponsorship" className="btn btn-outline" style={{ borderColor: "#fff", color: "#fff" }}>
              Sponsorship
            </Link>
          </div>
        </div>
      </section>

      <RevealSection className="explode-section">
        <div className="container explode-stage">
          <div className="explode-visual">
            {floatProduct && <img src={floatProduct} alt="" style={{ transform: "rotateY(12deg)" }} />}
          </div>
          <div className="explode-copy">
            <h2>Built in layers</h2>
            <p style={{ color: "var(--jt-muted)" }}>
              Neoprene, impact panels, stitch maps — scroll the kit story without slowing the page.
            </p>
            <ul>
              <li className="active">Outer race shell</li>
              <li>Impact foam map</li>
              <li>Stretch panels & seals</li>
              <li>Custom name / number zone</li>
            </ul>
          </div>
        </div>
      </RevealSection>

      <RevealSection>
        <div className="container">
          <div className="section-head">
            <h2>Rider Reviews</h2>
          </div>
          <div className="reviews">
            {meta.testimonials.map((t) => (
              <figure className="review-card" key={t.author}>
                <p>“{t.quote}”</p>
                <cite>— {t.author}</cite>
              </figure>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection>
        <div className="container">
          <div className="section-head">
            <h2>On the Water</h2>
          </div>
          <div className="video-grid">
            {[0, 1, 2].map((i) => (
              <button
                type="button"
                className="video-thumb"
                key={i}
                onClick={() => setActiveVideo(true)}
                aria-label="Play Jettribe video"
              >
                <img src={`/heroes/hero-${(i % 5) + 1}.jpg`} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          {activeVideo && (
            <div style={{ marginTop: 16 }}>
              <iframe
                title="Jettribe YouTube"
                width="100%"
                height="420"
                src="https://www.youtube.com/embed?listType=search&list=jettribe%20pwc"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0, background: "#111" }}
              />
            </div>
          )}
        </div>
      </RevealSection>

      <section className="vip-band">
        <div className="container">
          <h2>Join VIP</h2>
          <p style={{ color: "var(--jt-muted)", margin: 0 }}>
            Early access to drops, event news, and rider-only deals.
          </p>
          {vipDone ? (
            <p style={{ marginTop: 18, fontWeight: 600 }}>You’re on the list.</p>
          ) : (
            <form
              className="vip-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (vipEmail.includes("@")) setVipDone(true);
              }}
            >
              <input
                type="email"
                required
                placeholder="Email address"
                value={vipEmail}
                onChange={(e) => setVipEmail(e.target.value)}
                aria-label="Email"
              />
              <button className="btn btn-primary" type="submit">
                Sign Up
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
