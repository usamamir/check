# Daybook

One local job desk. It reads a resume, builds a search string, checks open job feeds, keeps a sheet, and writes cover-letter drafts.

It does not use Google Drive, Gmail, Sheets, Gemini, SerpAPI, or n8n. It does not sign in to LinkedIn, Indeed, or Google, and it does not send email.

## Windows

Open `Daybook-windows.zip`, then double-click `Daybook.exe`. Leave the black window open. Daybook opens in your browser. Click **Quit Daybook** at the bottom when you are done. If Windows says it protected your PC, click **More info**, then **Run anyway**.

## Run

```bash
node src/server.js
```

Open http://127.0.0.1:4173

Paste a resume, or upload a text-based PDF. The page starts from a short starter profile (11 years, Shopify, Amazon Seller Central, n8n). Replace that before you use a letter.

**Run today's pass** searches Remotive, Remote OK, Arbeitnow, and Jobicy. It keeps roles from the last 3 days, or the last 14 when the 3-day window is thin. It writes drafts for up to 8 new matches. Drafts are `.eml` files in `data/drafts/`. The To line is filled only when the posting itself lists an address.

The search string on the resume panel is there to paste into Google yourself. Daybook does not run that search.

**Add a posting** covers roles the feeds miss. Paste the description, including a contact line when one is printed.

**Download CSV** is the tracker.

A resume, the sheet, and drafts stay in `data/`, which is gitignored.

The hosted app stores each signed-in person's sheet in its own database row. Publish it as private or team so the resume is not on a public link.

## Daily run

```bash
node src/daily.js
```

Example local cron, 8:00:

```cron
0 8 * * * cd /path/to/check && node src/daily.js
```

## Tests

```bash
node --test
```
