export type Product = {
  id: number | null;
  sku: string;
  name: string;
  slug: string;
  old_url: string;
  new_url: string;
  price: number | null;
  sale_price: number | null;
  rrp: number | null;
  images: string[];
  image: string | null;
  categories: string[];
  sizes: string[];
  description: string;
  description_html?: string;
  in_stock: boolean;
  breadcrumbs?: { url: string; name: string }[];
};

export type SitePage = {
  slug: string;
  title: string;
  old_url: string;
  new_url: string;
  text: string;
};

export let products: Product[] = [];
export let pages: SitePage[] = [];
export let meta = {
  source: "https://www.jettribe.com",
  note: "",
  product_count: 0,
  contact: {
    phone: "951-246-3147",
    email: "ridersupport@jettribe.com",
    hours: "Mon - Fri, 9am - 5pm PT",
  },
  testimonials: [] as { quote: string; author: string }[],
};

let loadPromise: Promise<void> | null = null;

export function loadCatalog(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const [p, pg, m] = await Promise.all([
      fetch("/data/products.json").then((r) => r.json()),
      fetch("/data/pages.json").then((r) => r.json()),
      fetch("/data/site-meta.json").then((r) => r.json()),
    ]);
    products = p as Product[];
    pages = pg as SitePage[];
    meta = m as typeof meta;
  })();
  return loadPromise;
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return `$${n.toFixed(2)}`;
}

export function effectivePrice(p: Product): number | null {
  return p.sale_price ?? p.price;
}

export function isOnSale(p: Product): boolean {
  return p.sale_price != null && p.price != null && p.sale_price < p.price;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getPage(slug: string): SitePage | undefined {
  return pages.find((p) => p.slug === slug);
}

function haystack(p: Product): string {
  return `${p.name} ${p.sku} ${p.categories.join(" ")} ${p.description}`.toLowerCase();
}

export function searchProducts(query: string, limit = 24): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products
    .filter((p) => {
      const h = haystack(p);
      return terms.every((t) => h.includes(t));
    })
    .slice(0, limit);
}

export function productsInCategory(slug: string): Product[] {
  const key = slug.replace(/-/g, " ").toLowerCase();
  const slugKey = slug.toLowerCase();

  const special: Record<string, (p: Product) => boolean> = {
    "new-arrivals": (p) => /new|2026|2025|arrival/i.test(p.name),
    "new-featured": (p) => /new|2026|jtr|circuit/i.test(p.name),
    "best-sellers": (p) => Boolean(p.image) && p.in_stock,
    outlet: (p) => isOnSale(p),
    "outlet-gear": (p) => isOnSale(p),
    "outlet-apparel": (p) =>
      isOnSale(p) && /hoodie|shirt|short|hat|apparel|swim/i.test(haystack(p)),
    "outlet-accessories": (p) =>
      isOnSale(p) && /glove|goggle|towel|bag|key|decal/i.test(haystack(p)),
    "outlet-covers": (p) => isOnSale(p) && /cover/i.test(haystack(p)),
    "vests-under-100": (p) =>
      /vest/i.test(haystack(p)) && (effectivePrice(p) ?? 999) < 100,
    covers: (p) => /cover/i.test(haystack(p)),
    "sea-doo-covers": (p) => /sea-?doo|seadoo/i.test(haystack(p)) && /cover/i.test(haystack(p)),
    "yamaha-covers": (p) => /yamaha|waverunner/i.test(haystack(p)) && /cover/i.test(haystack(p)),
    "kawasaki-covers": (p) => /kawasaki/i.test(haystack(p)) && /cover/i.test(haystack(p)),
    "hydrospace-covers": (p) => /hydrospace/i.test(haystack(p)),
    "vintage-covers": (p) => /vintage|classic/i.test(haystack(p)) && /cover/i.test(haystack(p)),
    wetsuits: (p) => /wetsuit|john|jacket only|2 piece/i.test(haystack(p)),
    gloves: (p) => /glove/i.test(haystack(p)),
    goggles: (p) => /goggle/i.test(haystack(p)),
    towels: (p) => /towel/i.test(haystack(p)),
    hats: (p) => /hat|cap|beanie/i.test(haystack(p)),
    "boots-shoes": (p) => /boot|shoe/i.test(haystack(p)),
    jackets: (p) => /tour coat|jacket/i.test(haystack(p)),
    rashguards: (p) => /rashguard|rash guard/i.test(haystack(p)),
    "for-her": (p) => /ladies|women|her|female/i.test(haystack(p)),
    "for-him": (p) => /mens|men'|him|male|board short/i.test(haystack(p)),
    swimwear: (p) => /swim|bikini|board short|tankini/i.test(haystack(p)),
    "hoodies-sweatshirts": (p) => /hoodie|sweatshirt/i.test(haystack(p)),
    "vests-competition": (p) => /vest|impact/i.test(haystack(p)),
    "vests-us-coast-guard": (p) => /coast guard|uscg|vest/i.test(haystack(p)),
    "vests-neoprene": (p) => /neoprene|vest/i.test(haystack(p)),
    "vests-ce-european-certified": (p) => /ce |european|vest/i.test(haystack(p)),
    "2026-jtr-series": (p) => /2026|jtr/i.test(haystack(p)),
    "2025-jtr-series": (p) => /2025|jtr/i.test(haystack(p)),
    "circuit-2023": (p) => /circuit/i.test(haystack(p)),
    pivot: (p) => /pivot/i.test(haystack(p)),
    "team-rider-series": (p) => /team rider/i.test(haystack(p)),
    "hyper-2020": (p) => /hyper/i.test(haystack(p)),
    "hot-water-the-movie": (p) => /hot water/i.test(haystack(p)),
    recreation: (p) => /recreation|buoy|anchor|tow/i.test(haystack(p)),
    "gear-bags": (p) => /bag/i.test(haystack(p)),
    "gift-cards": (p) => /gift card/i.test(haystack(p)),
    jewelry: (p) => /jewelry|necklace|bracelet/i.test(haystack(p)),
    "customized-gear-factory": (p) => /custom/i.test(haystack(p)),
    "customized-vests-usa": (p) => /custom/i.test(haystack(p)) && /vest/i.test(haystack(p)),
    "ride-gear-photo-samples": (p) => /sample|photo/i.test(haystack(p)),
  };

  const pred = special[slugKey];
  if (pred) {
    const list = products.filter(pred);
    if (list.length) return list;
  }

  const byCat = products.filter((p) =>
    p.categories.some((c) => {
      const n = c.toLowerCase();
      return (
        n.includes(key) ||
        key.includes(n) ||
        n.replace(/[^a-z0-9]/g, "").includes(slugKey.replace(/-/g, ""))
      );
    }),
  );
  if (byCat.length) return byCat;

  return products.filter((p) => haystack(p).includes(key.split(" ")[0] || slugKey));
}

export function relatedProducts(p: Product, limit = 8): Product[] {
  const cat = p.categories[0];
  return products
    .filter((x) => x.slug !== p.slug && (cat ? x.categories.includes(cat) : true))
    .slice(0, limit);
}

export function bestSellers(limit = 12): Product[] {
  return products.filter((p) => p.image && p.in_stock && p.price != null).slice(0, limit);
}

export function categoryThumb(slugHint: string): string | null {
  const list = productsInCategory(slugHint);
  return list.find((p) => p.image)?.image ?? null;
}

export function categoryTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
