import { Link, useLocation, useParams } from "react-router-dom";
import { getPage, meta } from "@/data/products";
import "@/styles/shop.css";

const fallbacks: Record<string, { title: string; body: string }> = {
  contact: {
    title: "Contact Us",
    body: `Rider Support\nPhone: ${meta.contact.phone}\nEmail: ${meta.contact.email}\nHours: ${meta.contact.hours}`,
  },
  events: {
    title: "Events",
    body: "USA and international race calendars, photo reviews, and sponsorship information live here. Event listings sync from the Jettribe Race Family calendar at launch.",
  },
  "race-family": {
    title: "Jettribe Race Family",
    body: "The Jettribe Race Family connects riders across USA and international circuits. Follow the blog for race reports and sponsorship updates.",
  },
  "size-chart": {
    title: "Size Chart",
    body: getPage("size-chart")?.text ||
      "Use series-specific measurements for wetsuits, vests, gloves, and boots. When between sizes, size up for layering.",
  },
  account: {
    title: "Sign In",
    body: "Customer accounts connect to WooCommerce on the WordPress deployment. This preview uses local favourites and cart only.",
  },
  checkout: {
    title: "Checkout",
    body: "Checkout uses WooCommerce on the WordPress deployment. In this preview, your cart is stored locally so you can validate the storefront UX.",
  },
  "custom-gear-builder": {
    title: "Custom Gear Builder",
    body: "Open the interactive builder.",
  },
};

export function ContentPage() {
  const params = useParams();
  const location = useLocation();
  const slug = (params.slug || location.pathname.replace(/^\//, "") || "").replace(/\/$/, "");
  const page = getPage(slug);
  const fb = fallbacks[slug];
  const title = page?.title || fb?.title || slug;
  const body = page?.text || fb?.body || "Content will be imported from the matching Jettribe page.";

  if (slug === "custom-gear-builder") {
    return null;
  }

  return (
    <div className="container content-page">
      <h1>{title.replace(/ \| Jettribe$/i, "").replace(/ - Jettribe$/i, "")}</h1>
      <div className="body">{body}</div>
      <p style={{ marginTop: 32 }}>
        <Link to="/">Back home</Link>
      </p>
    </div>
  );
}
