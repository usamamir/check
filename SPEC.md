# Project Spec: "FORGE" — Premium Adaptive Strength Training App (Desktop, Offline, No Login)

> **Instructions to Cursor:** This is the full product spec. Read the whole thing before writing code. Do NOT build a simplified version. Build it **phase by phase** (see "Build Plan" at the end). Finish each phase completely, run it, fix errors, then stop and summarize what was done before starting the next phase. If something in this spec is unclear, choose the more complete / more polished option, not the simpler one.

---

## 1. Product Vision

FORGE is a premium desktop workout app in the same class as Fitbod. It is **not** a workout logger with a list of exercises. Its core value is an **adaptive engine** that:

1. Tracks how fatigued each muscle group is, based on what the user actually trained and when.
2. Generates the next workout automatically: the right muscles, exercises, sets, reps and weights. It uses the user's goal, available equipment, training history and recovery.
3. Applies progressive overload automatically, so suggested weights and reps go up as the user gets stronger.
4. Shows progress with high-quality charts, PRs, strength scores and a muscle recovery heatmap.

It must feel like a **paid product**: dark, sleek, animated, fast, and keyboard-friendly. Use Linear, Arc Browser, Whoop and Fitbod as the quality bar, not a Bootstrap admin template.

### Hard constraints
- **Desktop app** (Windows + macOS + Linux).
- **No login, no accounts, no backend, no cloud.** All data stays local on the user's machine.
- **Works offline**. Only YouTube video playback and optional online exercise lookups need internet. If they fail, the app degrades gracefully.
- **Only free resources.** No paid APIs and no API keys required for core features.

---

## 2. Tech Stack (use exactly this unless there's a blocking reason)

| Layer | Choice |
|---|---|
| Shell | **Electron** (latest stable) + **electron-vite** |
| UI | **React 18 + TypeScript (strict mode)** |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix primitives) |
| Animation | **Framer Motion** |
| State | **Zustand** (UI/session state) + **TanStack Query** (async data) |
| Local DB | **Dexie.js** (IndexedDB) with typed tables and versioned migrations |
| Charts | **Recharts** |
| Muscle body map | **react-body-highlighter** (front/back SVG body), or a custom SVG if it doesn't fit |
| Icons | **lucide-react** |
| Routing | **React Router** (hash router, which works with Electron) |
| Forms/validation | **react-hook-form + zod** |
| Dates | **date-fns** |
| Command palette | **cmdk** |
| Packaging | **electron-builder** (NSIS for Windows, DMG for macOS, AppImage for Linux) |
| Tests | **Vitest** for the workout engine (the engine MUST have unit tests) |

Folder structure:
```
src/
  main/            # Electron main process (window, menu, protocol, security)
  preload/         # contextBridge, minimal safe API
  renderer/
    app/           # routes, layout, providers
    features/
      workout/     # active workout session UI
      generator/   # adaptive engine (pure TS, no React)
      library/     # exercise library + detail pages
      history/
      progress/    # charts, PRs, strength score
      recovery/    # muscle heatmap
      programs/
      settings/
      onboarding/
    db/            # Dexie schema, migrations, repositories
    data/          # bundled exercise dataset + curated video map
    components/ui/ # shadcn components
    lib/           # utils: units, 1RM math, plate math, formatting
```

Electron security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and a strict Content Security Policy that allows only `https://www.youtube-nocookie.com`, `https://www.youtube.com`, `https://i.ytimg.com` and the exercise image source as external origins.

---

## 3. Free Data Sources

### 3.1 Exercise database (bundled, offline)
- Use **free-exercise-db** (GitHub: `yuhonas/free-exercise-db`). It is public-domain (Unlicense) and has 800+ exercises in JSON with fields like name, primaryMuscles, secondaryMuscles, equipment, level, mechanic (compound/isolation), force (push/pull), category, instructions, and images.
- Write a **build-time script** (`scripts/import-exercises.ts`) that downloads the JSON once, normalizes it to our schema, and saves it to `src/renderer/data/exercises.json`. Also copy or download the images into `resources/exercise-images/` so they work offline.
- Normalize muscle names to our fixed enum (see section 5) and equipment to our equipment enum.
- **Optional enrichment:** the **wger** open API (`https://wger.de/api/v2/`) is free and needs no key for read access. Use it only as an optional online "find more exercises" feature. Respect its CC-BY-SA data license and show attribution on the About screen.

### 3.2 YouTube videos (free, no API key)
- Every exercise detail page and the active-workout screen show a **demo video**.
- Embed with the **YouTube IFrame Player** using the privacy-enhanced domain `https://www.youtube-nocookie.com/embed/{VIDEO_ID}`. Use the parameters `rel=0&modestbranding=1&playsinline=1`, and support looping a short segment (`start`/`end`).
- **Do NOT invent or hallucinate YouTube video IDs.** Create `src/renderer/data/videoMap.json` with the shape `{ exerciseId: { videoId, start?, end?, channel } }`. Leave it **empty or with placeholders**, and I will fill it in with real IDs.
- If an exercise has no mapped video, show a card with:
  1. The bundled images from free-exercise-db, animated as a 2-frame start/end loop.
  2. A **"Find on YouTube"** button that opens `https://www.youtube.com/results?search_query={exercise name} proper form` in the user's default browser (`shell.openExternal`).
  3. A **"Paste video link"** field. The user pastes any YouTube URL, we parse the video ID (support `watch?v=`, `youtu.be/`, `shorts/` and `embed/` formats) and save it to the local DB. From then on that exercise uses the user's chosen video.
- **Electron + YouTube gotcha:** YouTube embeds often fail with "Error 153 / video player configuration error" when the page is loaded from `file://`, because no valid referrer/origin is sent. To fix it, serve the renderer through a **custom privileged protocol** (e.g. `app://forge`) registered with `protocol.handle`, or from a local HTTP origin. Also set a proper `Referer` with `session.webRequest.onBeforeSendHeaders` for youtube domains if needed. Test that a real embed plays in the packaged build, not only in dev.
- Show a lightweight offline fallback when there is no internet ("Video unavailable offline — showing images").

---

## 4. Core Features (all required)

### 4.1 Onboarding (first launch only, about 60 seconds)
A beautiful multi-step flow with progress dots and animated transitions:
1. **Goal:** Build Muscle (hypertrophy) / Get Stronger (strength) / Lose Fat & Tone / General Fitness / Powerbuilding.
2. **Experience:** Beginner (<6 months) / Intermediate (6m–3y) / Advanced (3y+).
3. **Body stats (optional):** sex, age, bodyweight, height, with a unit toggle for kg/lb and cm/ft-in.
4. **Schedule:** days per week (2–6) and target session length (30 / 45 / 60 / 75 / 90 min).
5. **Split preference:** Let FORGE decide (recommended) / Full Body / Upper-Lower / Push-Pull-Legs / Bro Split.
6. **Equipment / Gym profile:** a visual grid of equipment toggles (barbell, dumbbells with a max weight, kettlebells, cable machine, smith machine, leg press, pull-up bar, bench, adjustable bench, EZ bar, resistance bands, machines, bodyweight only). Include presets: "Commercial Gym", "Home Gym", "Bodyweight Only", "Hotel Gym".
7. **Optional baseline lifts:** "Do you know roughly what you lift?" Ask for bench / squat / deadlift / OHP, as weight × reps. This seeds the estimated 1RM. If skipped, the engine starts conservatively and calibrates over the first 2–3 sessions.

Everything is saved locally. All of it can be edited later in Settings.

### 4.2 Adaptive Workout Engine (the heart of the app)
Write it as **pure TypeScript in `features/generator/`** with no React imports, so it can be fully unit-tested.

**a) Muscle fatigue / recovery model**
- Track a fatigue value of 0–100% for each muscle group (section 5 enum).
- After each logged set: `fatigue += setStimulus × involvement`. Involvement is 1.0 for a primary muscle and 0.5 for a secondary. `setStimulus` scales with effort: a hard set (RPE ≥ 8 / RIR ≤ 2) counts more than an easy one.
- Fatigue decays exponentially over time. Use a per-muscle recovery half-life: large muscles (quads, hamstrings, glutes, back, chest) ≈ 24–30h half-life; small muscles (biceps, triceps, calves, abs, forearms, side delts) ≈ 16–20h. Scale it by experience level (beginners recover slightly slower from the same volume). Put all constants in a single `engineConfig.ts`.
- Recovery % = 100 − fatigue. This drives the heatmap and the muscle selection.

**b) Choosing today's muscles**
- Follow the user's split (or auto-pick a split from days/week + experience).
- Within that split, prefer the muscles that are most recovered and have the most weekly volume left to do. Track weekly sets per muscle against goal-based targets (e.g. hypertrophy 10–20 sets/muscle/week, strength lower volume but heavier).
- Never program a muscle that is <50% recovered as a primary target. Warn if the user forces it.

**c) Choosing exercises**
- Filter the library by the active gym profile's equipment.
- Score each candidate exercise by: targets the needed muscles; compound vs isolation fit (compounds first in the session); the user's history and preferences (favorites up-weighted, "never show me this" excluded, recently disliked down-weighted); variety (penalize exercises used in the last 1–2 sessions for that muscle, but keep 1–2 "anchor" lifts stable across weeks so progression can be tracked); difficulty level vs experience.
- Fit the exercise count and set count to the session length. Estimate time per set as work + rest, plus a warm-up allowance.
- Order: big compound → secondary compound → isolation → core/finisher.

**d) Sets, reps, weight (progressive overload)**
- Goal-based rep ranges: Strength 3–6, Hypertrophy 6–12 (isolation 10–15), Fat loss/General 10–15, Powerbuilding mixes heavy top sets + back-off sets.
- Estimate 1RM with the **Epley** formula (`w × (1 + reps/30)`), smoothed over the recent best sets (not a single noisy set).
- Target weight = %1RM for the target reps at the target RIR, rounded to available increments. Respect the equipment: plate increments for barbells, the dumbbell set available, and a cable stack step. All increments are configurable.
- **Double progression:** if the user hit the top of the rep range on all sets at the target RPE, increase weight next time. If they missed the bottom of the range, hold or reduce the weight. Two failed sessions in a row on a lift means an automatic ~10% deload for that lift.
- **Auto warm-up sets** for the first compound lift (e.g. bar × 10, 50% × 5, 70% × 3, 85% × 1), which can be toggled.
- Bodyweight exercises progress by reps and then suggest a harder variation.

**e) Explainability (premium touch)**
Every generated exercise has a small "Why this?" popover, for example: *"Chest is 94% recovered and you've done 4/12 weekly sets. Weight +2.5kg because you hit 3×10 last time at RPE 7."*

**f) Controls**
The user can **Regenerate** the whole workout, **Swap** a single exercise (show 5 ranked alternatives for the same muscle + equipment), **Add exercise**, **Remove**, **Reorder** (drag and drop), change sets/reps, or **lock** an exercise so regenerate keeps it.

### 4.3 Active Workout Session
- A full-screen, focused mode. The current exercise is large and the video/images are on the side.
- A set table for each exercise: set #, previous (last time's weight×reps shown in grey), target, weight input, reps input, RPE (optional, 6–10 chips), and a ✓ complete button.
- Mark set type: warm-up / working / drop set / failure.
- **Rest timer:** starts automatically when a set is completed. It shows a big circular countdown with +15s/−15s/skip, a sound and a system notification when it ends, and runs in the tray/taskbar if the window is minimized. Default rest times depend on the exercise type and goal.
- **Supersets / circuits:** group exercises together.
- **Plate calculator:** tap the weight to see which plates go on each side (configurable bar weight and available plates, in kg or lb).
- **Live PR detection** with a tasteful confetti/animation and a "New PR!" badge (weight PR, rep PR at a weight, estimated 1RM PR, volume PR).
- Session timer, total volume, sets completed, and a progress bar.
- Notes for each exercise and for the session.
- Finish screen: a summary card with duration, volume, PRs, muscles hit (mini heatmap) and a 1–5 rating of how the session felt (this feeds the engine). Offer "Save as template".
- If the app is closed mid-workout, the session is persisted and resumed on next launch.

### 4.4 Muscle Recovery Heatmap
- A front and back body SVG. Each muscle is colored by recovery %: red (fatigued) → amber → green (fresh).
- Hover a muscle to see its recovery %, last trained date, weekly sets vs target, and top exercises for it.
- Click a muscle to filter the exercise library to it, or to "Build a workout for this muscle".

### 4.5 Exercise Library
- Grid and list views with fast fuzzy search. Filters: muscle, equipment, level, compound/isolation, favorites, and "available with my equipment".
- Detail page: video/images, step-by-step instructions, primary/secondary muscles shown on a mini body map, the user's personal history for that exercise (chart of estimated 1RM over time, best sets, total volume), favorite, "never suggest", and personal notes.
- Users can create **custom exercises** with muscles, equipment and an optional YouTube link.

### 4.6 History
- A calendar view (heat-colored by volume) plus a list view.
- Open any past workout to see its details. Users can edit or delete it (edits recompute the fatigue model and PRs).

### 4.7 Progress & Analytics
- **Strength Score:** a single number per muscle group and overall, based on estimated 1RMs relative to bodyweight. Show it as a radar chart and a trend.
- Estimated 1RM trend per exercise, with selectable lifts.
- Weekly volume per muscle group (stacked bars) against the target bands.
- Workout frequency and streaks (weekly streak, not daily, so rest days don't break it).
- A PR timeline.
- Bodyweight log with a trend line (optional) and body measurements.
- Time ranges: 4W / 12W / 6M / 1Y / All.

### 4.8 Programs & Templates
- Save any workout as a template.
- Built-in program templates, written as JSON in `data/programs/`: e.g. 3-day Full Body Beginner, 4-day Upper/Lower, 6-day PPL, and a 5/3/1-style strength block. These still use the progression engine for weights.
- "Adaptive" mode (the default, Fitbod-style) vs "Follow program" mode.

### 4.9 Settings
- Units (kg/lb, cm/in), bar weight, available plates, dumbbell increments.
- Multiple **gym profiles** (Home / Work / Travel) with a quick switcher in the top bar.
- Goal, experience, schedule, split. Changing any of these regenerates upcoming workouts.
- Default rest times, warm-up toggle, sounds, notifications.
- Theme: dark (default), light, and an accent color picker.
- **Data:** Export everything as JSON, import from JSON, export the workout history as CSV, auto-backup to a user-chosen folder (daily, keep the last 10), and reset all data (with a typed confirmation).
- An About screen with credits/licenses for free-exercise-db, wger and other open-source libraries.

### 4.10 Desktop-native polish
- Custom frameless title bar on Windows/Linux and native traffic lights on macOS.
- **Command palette (Ctrl/Cmd+K):** start workout, search exercise, go to any page, switch gym profile.
- Keyboard shortcuts in the active workout: `Enter` = complete set, `Space` = start/skip rest timer, `↑/↓` = adjust weight, `Shift+↑/↓` = adjust reps, `N` = next exercise. Show a `?` shortcut cheat-sheet overlay.
- Remember window size and position. Minimize to tray during a workout with the timer in the tray tooltip.
- System notifications for the rest timer end and an optional "scheduled workout day" reminder.

---

## 5. Data Model (Dexie tables, all typed)

Muscle enum (fixed): `chest, front_delts, side_delts, rear_delts, biceps, triceps, forearms, upper_back, lats, lower_back, traps, abs, obliques, glutes, quads, hamstrings, adductors, abductors, calves, neck`.

Tables (add indexes where queries need them):
- `userProfile`: goal, experience, sex, birthYear, bodyweight, height, units, daysPerWeek, sessionMinutes, splitPref, createdAt.
- `gymProfiles`: id, name, equipment[], dumbbellMax, plates[], barWeight, cableStep, isActive.
- `exercises`: id, name, primaryMuscles[], secondaryMuscles[], equipment[], mechanic, force, level, instructions[], images[], isCustom.
- `exercisePrefs`: exerciseId, favorite, banned, customVideoId, notes.
- `workouts`: id, startedAt, endedAt, status (planned/active/completed), gymProfileId, rating, notes, source (adaptive/template/program).
- `workoutExercises`: id, workoutId, exerciseId, order, supersetGroup, notes, reasoning.
- `sets`: id, workoutExerciseId, order, type, targetWeight, targetReps, weight, reps, rpe, completedAt.
- `personalRecords`: id, exerciseId, type, value, setId, achievedAt.
- `bodyMetrics`: id, date, bodyweight, measurements{}.
- `templates`, `programs`, `appSettings`.

The muscle fatigue state is **derived** (recomputed from the sets), with a cached snapshot for speed. Write proper Dexie version migrations from day one.

---

## 6. Design System (make it look premium, not generic)

- **Dark-first**. Background near-black (`#0A0A0B`) with layered surfaces (`#121214`, `#1A1A1D`), subtle 1px borders (`white/6%`), and soft inner glows on cards.
- **One bold accent**, e.g. electric lime `#C6FF3D` or energetic orange `#FF5A1F`, user-changeable. Use it sparingly: primary buttons, progress rings, PR highlights.
- Typography: **Inter** or **Geist** for UI, and a condensed bold display face (e.g. **Barlow Condensed** / **Oswald**) for big numbers like weights, timers and stats. Use tabular numerals for all numbers.
- Big, confident numbers. Weight and reps inputs should feel like a premium fitness device, not tiny form fields.
- Motion: 150–250ms ease-out transitions, spring animations on set completion, smooth number tickers on stats, and page transitions with Framer Motion. Respect `prefers-reduced-motion`.
- Layout: a left sidebar (Today, Workout, Recovery, Library, History, Progress, Programs, Settings) that can collapse to icons. The main content has generous spacing.
- The **"Today" dashboard** is the home screen: a hero card with today's generated workout ("Push • 52 min • 6 exercises", muscle chips, a big **Start Workout** button), the recovery heatmap mini-view, the weekly streak, the most recent PR and a weekly volume ring.
- Empty states, loading skeletons and error states must all be designed. Never show raw blank screens.
- Accessibility: proper focus rings, keyboard-navigable everything, sufficient contrast, and aria labels.

---

## 7. Quality Requirements

- TypeScript strict, with no `any` in the engine or DB layer.
- The engine has **Vitest unit tests** covering: fatigue decay, muscle selection respecting recovery, equipment filtering, double-progression increase/hold/deload, weight rounding to available plates/dumbbells, the 1RM estimate, and session-length fitting.
- Seed script: a dev-only "Generate 8 weeks of fake history" button to test the charts and engine.
- No console errors. Handle the offline state everywhere.
- Performance: library search under 50ms; app cold start under 2s.
- ESLint + Prettier configured.
- `README.md` with setup, dev, build and packaging commands, and how to fill `videoMap.json`.

---

## 8. Build Plan (do these in order and stop after each to report)

1. **Scaffold:** electron-vite + React + TS + Tailwind + shadcn. Add the custom `app://` protocol (for YouTube embeds), security settings, the sidebar layout, routing, theme tokens and the empty pages with designed empty states.
2. **Data layer:** the Dexie schema + migrations, the exercise import script, the bundled exercises + images, repositories, and the settings/gym profiles.
3. **Onboarding flow**, fully designed.
4. **Exercise Library** + detail page + YouTube embed / fallback / paste-link logic + custom exercises.
5. **Adaptive engine** (pure TS) + **full unit tests**. Don't move on until the tests pass.
6. **Today dashboard** + workout generation UI (why-this popovers, swap, regenerate, lock, reorder).
7. **Active Workout Session:** set logging, rest timer, plate calculator, supersets, PR detection, resume after crash, the finish summary.
8. **Recovery heatmap** (body SVG) wired to the engine.
9. **History** (calendar + list + edit) and **Progress** analytics (all charts, strength score).
10. **Programs & templates.**
11. **Desktop polish:** command palette, shortcuts, tray, notifications, window state, title bar.
12. **Data export/import/backup**, the About/licenses screen, and the dev seed data.
13. **Packaging** with electron-builder for Win/Mac/Linux, plus a final QA pass: test the YouTube embed in the packaged build, offline mode and a fresh install.

At each phase, prefer the finished, polished version over a placeholder. If you must stub something, mark it with `// TODO(phase-N):` and list it in your summary.
