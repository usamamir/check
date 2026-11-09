export const DEFAULT_BLOCKLIST = [
  "amazon.com",
  "ebay.com",
  "walmart.com",
  "etsy.com",
  "alibaba.com",
  "aliexpress.com",
  "temu.com",
  "wikipedia.org",
  "reddit.com",
  "youtube.com",
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "shopify.com",
  "cjdropshipping.com",
  "spocket.co",
  "zendrop.com",
  "oberlo.com",
  "dhgate.com",
  "wish.com",
  "target.com",
  "homedepot.com",
  "lowes.com",
  "costco.com",
  "google.com",
  "bing.com",
  "yahoo.com",
  "yelp.com",
  "craigslist.org",
];

export const DEFAULT_SCORE_WEIGHTS = {
  dropshipEvidence: 40,
  usConfidence: 15,
  contactability: 15,
  catalogFit: 15,
  legitimacy: 10,
};

export const DEFAULT_SETTINGS: Record<string, string> = {
  brave_search_api_key: "",
  serpapi_api_key: "",
  google_cse_api_key: "",
  google_cse_cx: "",
  llm_provider: "openai",
  llm_api_key: "",
  llm_base_url: "",
  llm_model: "gpt-4o-mini",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  user_agent_contact: "you@example.com",
  crawl_max_pages: "25",
  crawl_rate_per_sec: "1",
  job_concurrency: "2",
  daily_email_cap: "30",
  emails_sent_today: "0",
  emails_sent_date: "",
  my_business_name: "My Store",
  my_physical_address: "123 Main St, City, ST 00000",
  my_store_name: "My Store",
  my_marketplaces: "Shopify, Amazon, Walmart, eBay",
  my_opt_out_line: "If you'd prefer not to hear from us, reply with \"unsubscribe\".",
  score_weights: JSON.stringify(DEFAULT_SCORE_WEIGHTS),
  domain_blocklist: JSON.stringify(DEFAULT_BLOCKLIST),
  price_band_min: "5",
  price_band_max: "500",
  followup_days: "5",
  theme: "system",
};

export const DEFAULT_TEMPLATES = [
  {
    id: "tpl-initial",
    name: "Initial dropship partnership",
    kind: "initial",
    subject: "Dropship partnership inquiry — {{myStoreName}} × {{company}}",
    body: `Hi {{ownerFirstName}},

I'm reaching out from {{myStoreName}}. We sell {{niche}} across {{myMarketplaces}} and are looking for reliable US-based partners who can dropship.

Your catalog (e.g. {{productExample}}) looks like a strong fit for our customers. Do you offer a dropship or wholesale program for online retailers?

Happy to share volume estimates and marketplace details. Looking forward to hearing from you.

Best,
{{myStoreName}}
{{myBusinessName}}
{{myPhysicalAddress}}

{{myOptOutLine}}`,
  },
  {
    id: "tpl-followup",
    name: "Follow-up after 5 days",
    kind: "followup",
    subject: "Following up — dropship partnership with {{company}}",
    body: `Hi {{ownerFirstName}},

Just bumping this in case it got buried. We're still interested in partnering with {{company}} for dropship/wholesale fulfillment into our {{myMarketplaces}} channels.

If now isn't a good time or you don't offer dropshipping, a quick note either way would be appreciated.

Thanks,
{{myStoreName}}
{{myBusinessName}}
{{myPhysicalAddress}}

{{myOptOutLine}}`,
  },
  {
    id: "tpl-wholesale",
    name: "Wholesale fallback ask",
    kind: "wholesale",
    subject: "Wholesale account request — {{myStoreName}}",
    body: `Hi {{ownerFirstName}},

If dropshipping isn't available, we'd love to explore a wholesale account with {{company}} for {{niche}}.

We sell on {{myMarketplaces}} and can purchase in volume. Please let me know the application process, MOQ, and any MAP requirements.

Thank you,
{{myStoreName}}
{{myBusinessName}}
{{myPhysicalAddress}}

{{myOptOutLine}}`,
  },
];

export const PIPELINE_STATUSES = [
  "new",
  "researching",
  "contacted",
  "replied",
  "negotiating",
  "approved",
  "listing_live",
  "rejected",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  new: "New",
  researching: "Researching",
  contacted: "Contacted",
  replied: "Replied",
  negotiating: "Negotiating",
  approved: "Approved (Supplier)",
  listing_live: "Listing Live",
  rejected: "Rejected / Not a fit",
};
