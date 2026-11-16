# Uzi Mir — Portfolio

SellerOS 2016 → Commerce 2026 interactive portfolio.

## Hostinger / cPanel (no WordPress)

1. Download [`digivistaco-public-html.zip`](https://github.com/usamamir/check/raw/cursor/hostinger-public-html-0d15/digivistaco-public-html.zip)
2. hPanel → **Files → File Manager → public_html**
3. Upload the zip → **Extract** so `index.html` sits directly in `public_html`
4. Enable free SSL for your domain
5. Visit the site and hard-refresh

Rebuild locally:

```bash
cd portfolio
npm install
npm run pack:public-html
```

## WordPress theme (optional)

```bash
cd portfolio
npm run pack:wp
```

## Preview locally

```bash
cd portfolio
npm install
npm run dev
```
