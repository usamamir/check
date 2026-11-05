# Streakly

A Windows desktop habit tracker inspired by [Streaks](https://streaks.app/). Build good habits, break bad ones, and don’t break the chain.

## Windows download (runnable)

**Portable EXE (no installer):** `Streakly-Windows-1.0.0-x64.exe`

1. Download the `.exe`
2. Double-click to launch (Windows may show SmartScreen on first run — choose *More info* → *Run anyway*)
3. Habits are saved locally on your PC

Rebuild anytime:

```bash
npm install
npm run pack:win
```

Output lands in `dist/Streakly-Windows-1.0.0-x64.exe`.

## Features

- Up to **24 habits** across 4 pages (6 each)
- Daily streaks with flexible schedules (daily, weekdays, weekends, custom days, times per week)
- **Build** habits, **Break** (negative) habits, and **Timed** habits with a built-in timer
- Per-habit colors, icons, reminders, and daily notes
- Statistics: current / best streak and 30-day completion rate
- 8 color themes
- Local-only storage (no account)

Apple-only Streaks features (Health auto-complete, iCloud sharing, Watch, widgets) are not on Windows; everything else for day-to-day streak tracking works offline.

## Run from source

```bash
npm install
npm start
```

## Usage

- **Click** a habit to mark it done (or open the timer for timed habits)
- **Long-press / right-click** a habit for details, history calendar, and notes
- Use the **+** button or empty slots to add habits
- Swipe or use arrow keys to change pages
