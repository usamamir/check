export const profile = {
  name: 'Uzi Mir',
  first: 'Uzi',
  last: 'Mir',
  title: 'Amazon Master & E-commerce Strategist',
  tagline:
    'Scaling brands that convert. Listings, PPC, and visual systems engineered for marketplace dominance.',
  email: 'payoneerusama@gmail.com',
  education: {
    school: 'NUST University',
    degree: 'Master of Software Engineering',
    years: '2022 — 2024',
  },
  stats: [
    { value: '7+', label: 'Years scaling commerce' },
    { value: '40+', label: 'Brands partnered' },
    { value: '20', label: 'Distinct niches' },
    { value: '1000+', label: 'SKUs optimized daily' },
  ],
  about: [
    'With over seven years of experience in scaling e-commerce businesses, I have successfully collaborated with more than 40 brands across 20 distinct niches.',
    'I specialize in Amazon listing optimization, PPC campaign management, and comprehensive product research — all aimed at maximizing visibility and enhancing sales performance.',
    'With strong leadership in strategic planning and project management, combined with a deep understanding of graphic design and content creation, I deliver transformative results and scale businesses to new heights.',
  ],
}

export const work = [
  {
    id: '01',
    company: 'Toynk Toys',
    location: 'USA',
    role: 'Amazon Expert & Bulk Listing Lead',
    years: '2023 — 2024',
    summary:
      'Directed Amazon listing systems at scale — 1000+ product variations daily — with A/B testing and PPC that lifted conversion and market presence.',
    focus: ['Bulk listings', 'A/B testing', 'Amazon PPC', 'Conversion'],
    asin: 'TYNK-BULK-01',
    rank: '#12',
  },
  {
    id: '02',
    company: 'Silicon Valley Commerce',
    location: 'USA',
    role: 'Amazon Lead',
    years: '2022 — 2023',
    summary:
      'Spearheaded account strategy across listings and high-impact PPC, using Amazon and Google Analytics to climb rankings and sustain growth.',
    focus: ['Account strategy', 'Rank growth', 'Analytics', 'PPC'],
    asin: 'SVC-LEAD-02',
    rank: '#28',
  },
  {
    id: '03',
    company: 'EcomCircle',
    location: 'USA',
    role: 'Listing Manager | Team Lead',
    years: '2021 — 2022',
    summary:
      'Led a cross-functional listings team across platforms, shipping SEO/SERP systems and A+ content with design partners.',
    focus: ['Team leadership', 'SEO / SERP', 'A+ Content', 'Multi-channel'],
    asin: 'ECRC-TEAM-03',
    rank: '#41',
  },
  {
    id: '04',
    company: 'Cowin Audio',
    location: 'USA',
    role: 'E-commerce Manager',
    years: '2020 — 2021',
    summary:
      'Owned e-commerce operations end-to-end — listings, social, PPC — and directed video/graphic storytelling in Adobe Creative Suite.',
    focus: ['Brand growth', 'PPC', 'Video', 'Creative direction'],
    asin: 'COWN-ECOM-04',
    rank: '#63',
  },
  {
    id: '05',
    company: 'X-Gamer Energy',
    location: 'Sweden',
    role: 'E-commerce Manager',
    years: '2019',
    summary:
      'Ran multi-channel strategy across Amazon, Shopify, and Walmart with listing optimization that drove measurable sales growth.',
    focus: ['Amazon', 'Shopify', 'Walmart', 'Market positioning'],
    asin: 'XGMR-MULTI-05',
    rank: '#88',
  },
  {
    id: '06',
    company: 'Bastion',
    location: 'USA',
    role: 'Amazon Expert',
    years: '2019',
    summary:
      'Optimized listings and PPC while shipping Amazon A+ Content systems that elevated brand positioning and engagement.',
    focus: ['A+ Content', 'PPC', 'Visibility', 'Brand systems'],
    asin: 'BSTN-APLUS-06',
    rank: '#104',
  },
]

export const capabilities = [
  {
    group: 'Amazon Systems',
    items: [
      'Seller Central',
      'Listing Optimization',
      'A+ Content',
      'Store Design',
      'PPC',
      'Product Research',
      'Bulk Uploads',
    ],
  },
  {
    group: 'Channels',
    items: ['Shopify', 'Walmart', 'eBay', 'WordPress', 'Social Commerce'],
  },
  {
    group: 'Growth',
    items: [
      'Google Ads',
      'Google Analytics',
      'SEO / SERP',
      'Social Advertising',
      'Market Research',
    ],
  },
  {
    group: 'Craft',
    items: [
      'Photoshop',
      'Premiere Pro',
      'After Effects',
      'Illustrator',
      'Canva',
      'Brand Storytelling',
    ],
  },
]

export const tools = [
  'Helium 10',
  'Jungle Scout',
  'Sellics',
  'SEMrush',
  'Keepa',
  'Viral Launch',
  'ClickUp',
  'Jira',
  'Notion',
  'Slack',
]

export const desktopIcons = [
  { id: 'about', label: 'About_Uzi.txt', icon: 'doc', window: 'about' },
  { id: 'listings', label: 'Active_Listings', icon: 'box', window: 'listings' },
  { id: 'ppc', label: 'PPC_Command', icon: 'chart', window: 'ppc' },
  { id: 'research', label: 'Research_Lab', icon: 'search', window: 'research' },
  { id: 'brands', label: 'Brand_Roster.xls', icon: 'sheet', window: 'brands' },
  { id: 'mail', label: 'Inbox', icon: 'mail', window: 'mail' },
  { id: 'trash', label: 'Recycle_Ads', icon: 'trash', window: null },
] as const

export type WindowId = 'about' | 'listings' | 'ppc' | 'research' | 'brands' | 'mail' | 'update'
