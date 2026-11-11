export type MegaColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

export type MainNavItem = {
  label: string;
  href: string;
  columns: MegaColumn[];
};

export const utilityLeft = [
  { label: "Jettribe Race Family", href: "/race-family" },
  { label: "Blog", href: "/blog" },
];

export const helpLinks = [
  { label: "Order Status", href: "/order-status" },
  { label: "Shipping Info", href: "/shipping-info" },
  { label: "Returns", href: "/return-policy" },
  { label: "Size Chart", href: "/size-chart" },
  { label: "Warranty Policy", href: "/warranty-policy" },
  { label: "Financing", href: "/financing" },
  { label: "Contact Us", href: "/contact" },
];

export const utilityRight = [
  { label: "Dealers / Dropshipping", href: "/dropshipping" },
  { label: "Help", href: "#", children: helpLinks },
  { label: "Join VIP", href: "/vip" },
  { label: "Sign In", href: "/account" },
];

export const promoMessages = [
  "Free USA Shipping on Orders $400+",
  "Join VIP for early access to new series drops",
  "Custom Gear Builder — design your race kit",
];

export const mainNav: MainNavItem[] = [
  {
    label: "New & Featured",
    href: "/shop/new-featured",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "New Arrivals", href: "/shop/new-arrivals" },
          { label: "Best Sellers", href: "/shop/best-sellers" },
          { label: "VIP Deals", href: "/vip" },
        ],
      },
      {
        heading: "Collections",
        links: [
          { label: "2026 JTR Series", href: "/shop/2026-jtr-series" },
          { label: "2025 JTR Series", href: "/shop/2025-jtr-series" },
          { label: "Circuit Series", href: "/shop/circuit-2023" },
          { label: "Pivot Series", href: "/shop/pivot" },
          { label: "Team Rider Series", href: "/shop/team-rider-series" },
          { label: "Hyper Series", href: "/shop/hyper-2020" },
          { label: "Hot Water: The Movie", href: "/shop/hot-water-the-movie" },
        ],
      },
    ],
  },
  {
    label: "Ride Gear",
    href: "/shop/wetsuits",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "New Ride Gear", href: "/shop/new-arrivals" },
          { label: "Best Sellers", href: "/shop/best-sellers" },
          { label: "Size Chart", href: "/size-chart" },
        ],
      },
      {
        heading: "Wetsuits & Layers",
        links: [
          { label: "Wetsuits", href: "/shop/wetsuits" },
          { label: "Tour Coat Jackets", href: "/shop/jackets" },
          { label: "Rashguards", href: "/shop/rashguards" },
        ],
      },
      {
        heading: "Vests",
        links: [
          { label: "US Coast Guard", href: "/shop/vests-us-coast-guard" },
          { label: "Competition", href: "/shop/vests-competition" },
          { label: "Neoprene", href: "/shop/vests-neoprene" },
          { label: "CE European Certified", href: "/shop/vests-ce-european-certified" },
          { label: "Black Out Color Kits", href: "/shop/black-out-color-kits-1" },
        ],
      },
      {
        heading: "Hands, Feet & Eyes",
        links: [
          { label: "Gloves", href: "/shop/gloves" },
          { label: "Boots & Shoes", href: "/shop/boots-shoes" },
          { label: "Goggles", href: "/shop/goggles" },
        ],
      },
      {
        heading: "Protection",
        links: [{ label: "Protective Gear", href: "/shop/protective-gear" }],
      },
    ],
  },
  {
    label: "Casual Wear",
    href: "/shop/for-him",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "For Her", href: "/shop/for-her" },
          { label: "For Him", href: "/shop/for-him" },
          { label: "Swimwear", href: "/shop/swimwear" },
          { label: "Hoodies & Sweatshirts", href: "/shop/hoodies-sweatshirts" },
          { label: "Hats", href: "/shop/hats" },
        ],
      },
    ],
  },
  {
    label: "Accessories",
    href: "/shop/recreation",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "Gear Bags", href: "/shop/gear-bags" },
          { label: "Towels", href: "/shop/towels" },
          { label: "Gift Cards", href: "/shop/gift-cards" },
        ],
      },
      {
        heading: "Ride",
        links: [
          { label: "Recreation", href: "/shop/recreation" },
          { label: "Anchors & Buoys", href: "/shop/anchors-buoys" },
          { label: "Keys & Lanyards", href: "/shop/keys-lanyards" },
          { label: "Goggles", href: "/shop/goggles" },
        ],
      },
      {
        heading: "PWC Care",
        links: [
          { label: "Clean & Care", href: "/shop/clean-care" },
          { label: "Graphics Kits", href: "/shop/graphics-kits" },
          { label: "Decals & Signs", href: "/shop/decals-signs" },
          { label: "Name Plates", href: "/shop/name-plates" },
          { label: "Replacement Parts", href: "/shop/replacement-parts" },
        ],
      },
      {
        heading: "Race Day",
        links: [
          { label: "Race Site Equipment", href: "/shop/race-site-equipment" },
          { label: "Trailer Accessories", href: "/shop/trailer-accessories-1" },
          { label: "VP Racing Containers", href: "/shop/vp-racing-containers" },
        ],
      },
      {
        heading: "Gifts",
        links: [
          { label: "Gift Cards", href: "/shop/gift-cards" },
          { label: "Jewelry", href: "/shop/jewelry" },
          { label: "Hats", href: "/shop/hats" },
        ],
      },
    ],
  },
  {
    label: "PWC Covers",
    href: "/shop/covers",
    columns: [
      {
        heading: "Featured",
        links: [{ label: "Shop All Covers", href: "/shop/covers" }],
      },
      {
        heading: "Shop by Brand",
        links: [
          { label: "Sea-Doo", href: "/shop/sea-doo-covers" },
          { label: "Yamaha", href: "/shop/yamaha-covers" },
          { label: "Kawasaki", href: "/shop/kawasaki-covers" },
          { label: "Hydrospace", href: "/shop/hydrospace-covers" },
          { label: "Vintage Covers", href: "/shop/vintage-covers" },
        ],
      },
    ],
  },
  {
    label: "Custom",
    href: "/custom-gear-builder",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "Custom Gear Builder", href: "/custom-gear-builder" },
          { label: "Customized Gear - Factory", href: "/shop/customized-gear-factory" },
          { label: "Customized Vests - USA", href: "/shop/customized-vests-usa" },
        ],
      },
    ],
  },
  {
    label: "Outlet",
    href: "/shop/outlet",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "Vests Under $100", href: "/shop/vests-under-100" },
          { label: "All Outlet", href: "/shop/outlet" },
          { label: "Outlet Gear", href: "/shop/outlet-gear" },
          { label: "Outlet Apparel", href: "/shop/outlet-apparel" },
          { label: "Outlet Accessories", href: "/shop/outlet-accessories" },
          { label: "Outlet PWC Covers", href: "/shop/outlet-covers" },
          { label: "Photography Samples", href: "/shop/ride-gear-photo-samples" },
          { label: "Scratch & Dent", href: "/shop/scratch-dent" },
        ],
      },
    ],
  },
  {
    label: "Events",
    href: "/events",
    columns: [
      {
        heading: "Featured",
        links: [
          { label: "USA Events", href: "/events" },
          { label: "International Events", href: "/events" },
          { label: "Jettribe Race Family", href: "/race-family" },
          { label: "Photo Reviews", href: "/blog" },
          { label: "International Partners", href: "/sponsorship" },
          { label: "Sponsorship Information", href: "/sponsorship" },
        ],
      },
    ],
  },
];

export const footerColumns = [
  {
    heading: "Rider Support",
    links: [
      { label: "Order Status", href: "/order-status" },
      { label: "Shipping Info", href: "/shipping-info" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "Warranty Policy", href: "/warranty-policy" },
      { label: "Financing", href: "/financing" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
  {
    heading: "Rider Resources",
    links: [
      { label: "Culture", href: "/culture" },
      { label: "Careers", href: "/contact" },
      { label: "Blog", href: "/blog" },
      { label: "Gift Certificates", href: "/shop/gift-cards" },
      { label: "Legal", href: "/legal-mumbo-jumbo" },
      { label: "Logo Download", href: "/jettribe-logos" },
      { label: "Reseller Dropshipping", href: "/dropshipping" },
    ],
  },
];

export const shopByCategory = [
  { label: "Wetsuits", href: "/shop/wetsuits", imageKey: "wetsuits" },
  { label: "Vests", href: "/shop/vests-competition", imageKey: "vests" },
  { label: "Boots & Shoes", href: "/shop/boots-shoes", imageKey: "boots" },
  { label: "Gloves", href: "/shop/gloves", imageKey: "gloves" },
  { label: "Goggles", href: "/shop/goggles", imageKey: "goggles" },
  { label: "Tour Coats", href: "/shop/jackets", imageKey: "jackets" },
  { label: "Covers", href: "/shop/covers", imageKey: "covers" },
];
