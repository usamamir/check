# SupplyScout

Local desktop web app for discovering **US-based** brands/manufacturers/wholesalers that allow dropshipping, scoring them, managing a pipeline, and drafting CAN-SPAM-aware outreach.

Runs entirely on your machine. No user accounts. Data stays in `./data/supplyscout.db`.

## Quick start

```bash
npm install
npx playwright install chromium   # for JS-heavy site fallback
cp .env.example .env.local        # optional — keys also editable in Settings
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local app |
| `npm run build` / `npm start` | Production build |
| `npm test` | Unit tests (extractors + scorers) |
| `npm run smoke -- domain1.com domain2.com` | Full crawl pipeline on real domains |
| `npm run seed:dev` | Insert a fake lead for UI demos |
| `npm run db:studio` | Drizzle Studio (optional) |

## What it does

1. **Discover** candidates via manual domain import and/or official search APIs (Brave, SerpAPI, Google CSE).
2. **Crawl** each site politely (`robots.txt`, ≤1 req/s/domain, page cap, honest User-Agent).
3. **Extract** dropship signals, US location, contacts (emails/phones/forms), owner/founder, socials, Shopify catalog.
4. **Score** 0–100 with transparent breakdown and A–D tiers.
5. **Manage** leads in a table + Kanban pipeline, draft outreach, export CSV/XLSX, backup/restore SQLite.

## API keys (optional)

Manual import works with **zero keys**. For automated discovery, add one of:

- **Brave Search API** — [brave.com/search/api](https://brave.com/search/api/)
- **SerpAPI** — [serpapi.com](https://serpapi.com/)
- **Google Programmable Search** — API key + CX from [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)

Optional:

- **LLM** (OpenAI-compatible or Anthropic) for policy classification / owner extraction
- **SMTP** for one-by-one sending (daily cap default 30)

Set keys in `.env.local` or **Settings** (stored in SQLite). Never hardcode secrets.

## Compliance

- Business contact info only (publicly published on the business site).
- Respects `robots.txt`; User-Agent: `SupplyScoutBot/1.0 (+contact: …)`.
- Does **not** scrape LinkedIn / Facebook / Instagram / Google Search HTML.
- Stores a source URL for every extracted field.
- Outreach templates include business name, physical address, and opt-out line.
- **Do not contact** flag blocks exports and outreach.
- Emails are drafted locally; mass-send is not supported.

## Architecture

- **Next.js 14** App Router + TypeScript
- **SQLite** via Drizzle (`./data/supplyscout.db`)
- **In-process job queue** persisted in SQLite (survives restart) + SSE live progress
- **Cheerio** HTML crawl with **Playwright** fallback for JS-heavy pages
- **Vitest** fixture tests for extractors/scorers

## Troubleshooting

| Issue | Fix |
|---|---|
| `better-sqlite3` native build fails | `npm rebuild better-sqlite3` (needs build tools) |
| Playwright missing browsers | `npx playwright install chromium` |
| Discovery finds nothing | Add a search API key **or** paste domains in Manual import |
| Domain marked blocked | Cloudflare/bot wall — review manually; we do not bypass protections |
| Restore DB not loading | Restart `npm run dev` after restore |
| SMTP send fails | Use an app password; check host/port/from; watch daily cap |

## Smoke test

```bash
npm run smoke -- allbirds.com brooklinen.com
```

Prints extracted company, dropship signals, contacts, score, and errors for each domain.
