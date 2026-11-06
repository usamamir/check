# Fitbod Homepage Clone

Unofficial visual recreation of [fitbod.me](https://fitbod.me/) built with React + Vite, plus a Windows desktop app.

## Windows (.exe)

Download **`FitbodClone-portable.exe`** from the agent artifacts / PR attachments, then double-click it.

- Portable — no install required
- Windows 10/11 x64
- First launch may extract to a temp folder and open a desktop window
- Windows SmartScreen may warn because the file is unsigned; choose **More info → Run anyway**

Rebuild the exe locally (from this repo on any OS with Node):

```bash
npm install
npm run dist:win
# output: release/FitbodClone-portable.exe
```

## Web (browser)

```bash
npm install
npm run dev
```

## Build web only

```bash
npm run build
npm run preview
```

Includes homepage sections (hero, features, featured-in, FAQ, CTA, footer), Fitbod marketing assets, App Store screenshots, and the official Fitbod YouTube promo embed.
