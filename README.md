# FORGE

Premium adaptive strength training for desktop. Offline-first, no accounts, no cloud.

## Stack

- Electron + electron-vite
- React + TypeScript (strict)
- Tailwind CSS + shadcn/ui (Radix)
- Zustand + TanStack Query
- Dexie.js (Phase 2+)
- Vitest for the workout engine (Phase 5+)

## Develop

```bash
npm install
npm run import:exercises   # first time (or when refreshing free-exercise-db)
npm run dev
```

`import:exercises` downloads [free-exercise-db](https://github.com/yuhonas/free-exercise-db), normalizes muscles/equipment to FORGE enums, writes `src/renderer/src/data/exercises.json`, and unpacks offline images into `resources/exercise-images/` (~100MB). Use `SKIP_IMAGES=1` for JSON only.

## Quality

```bash
npm run typecheck
npm run lint
npm test
```

## Build / package

```bash
npm run build
npm run build:linux   # AppImage
npm run build:win     # NSIS
npm run build:mac     # DMG
```

Packaged builds load the renderer from the privileged `app://forge` protocol so YouTube embeds receive a valid origin (avoids Error 153 from `file://`). QA checklist: fresh install onboarding, offline library images, generate → start → log sets, recovery heatmap, export/import JSON.

Dev: press **Ctrl/Cmd+K** for the command palette. Settings → **Seed 8 weeks demo history** fills charts.

## YouTube video map

Demo embeds are driven by `src/renderer/src/data/videoMap.json`:

```json
{
  "Barbell_Bench_Press_-_Medium_Grip": {
    "videoId": "REAL_ID_HERE",
    "start": 12,
    "end": 45,
    "channel": "Channel Name"
  }
}
```

Leave entries empty until you paste real IDs. Never invent video IDs. Exercises without a mapping show bundled images plus Find on YouTube / Paste link.

## Protocol note

Production loads the renderer from `app://forge` (privileged custom protocol) so YouTube embeds receive a valid origin/referrer and avoid Error 153 from `file://`.
