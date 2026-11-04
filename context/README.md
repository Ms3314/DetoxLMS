# Context: DetoxLMS (yt-course-hub)

Reusable orientation for anyone (human or AI agent) starting work in this repo.
Read this index first, then only the files relevant to the task.

| File | Read it when you need to... |
| --- | --- |
| [overview.md](overview.md) | Understand what the app is, its stack, commands, and how it is deployed |
| [architecture.md](architecture.md) | Find where code lives, how components/views/hooks connect, how the Player works |
| [data-and-storage.md](data-and-storage.md) | Touch playlists data or any `localStorage` key / shape (nothing is server-side) |
| [playlists-guide.md](playlists-guide.md) | Add, rename, or refresh a playlist |
| [design-system.md](design-system.md) | Change CSS/UI so it matches the "Signal Dark" look |
| [gotchas-and-conventions.md](gotchas-and-conventions.md) | Avoid known traps, stale docs, and follow code conventions |

## One-paragraph summary

A client-only React 19 + Vite 8 app branded **Sami Labs**. Three sections:
**Videos** (YouTube course playlists with embedded player, watch tracking,
resume-where-you-left-off, per-video notes, and a side notepad), **Sami Labs**
(multi-page free-form writing), and **Todos** (checklist tagged by course).
All user state lives in the browser's `localStorage`; the playlist/video
catalogue is a static generated file, `src/data/playlists.js`. There is no
backend, no router, no test suite, and no TypeScript.

## Keeping this folder accurate

These docs describe the repo as of commit `6fd913d` (2026-11-03). When you
change behavior, update the matching file here in the same commit, especially
storage keys and data shapes, since changing those can orphan users' saved data.

## Changes since the docs above were written (milestone 1, branch `detoxlms-foundations`)

The other files describe the pre-milestone app; where they conflict, this section wins.

- Brand is now **DetoxLMS** (`src/lib/brand.ts`). Storage keys keep the `ytch-` prefix.
- Tabs were replaced by **React Router** routes: `/` Focus (placeholder `src/views/FocusView.tsx`),
  `/library` (VideosView), `/pages` (ThoughtsView, formerly the "Sami Labs" tab), `/todos`.
  `ytch-view-v1` is no longer used. `vercel.json` rewrites all paths to `index.html`.
- TypeScript is set up for new code (`tsconfig.json`, `npm run typecheck`); Vitest via `npm test`.
- New pure, tested focus logic in `src/focus/`: `rules.ts` (grace 10 s, 3 strikes, 2 min away,
  10 min minimum, 12 h daily cap), `engine.ts` (session state machine), `stats.ts` (counted hours,
  streak eligibility, daily cap, ranks). A strike is an absence that outlasts the grace period.
- Plan and decisions: `plans/focus-platform-plan.md`.

## Milestone 2 (branch `focus-screen`): the focus session

- `/` now runs a real session: `FocusView` (setup -> 3 s countdown -> locked screen -> summary).
  Setup (`src/focus/FocusSetup.tsx`) picks a course, start video and length; Start is a click so
  fullscreen is allowed. Singles and user playlists are not part of this milestone.
- `src/focus/useFocusSession.ts` ticks the engine every 250 ms and turns visibility, window focus
  and fullscreen changes into leave/return events (`presence.ts`). `document.hasFocus()` is used
  because it stays true while focus is inside the YouTube iframe. Fullscreen is only *required* if
  it actually started and the device is not touch-based; Esc is captured via Keyboard Lock (Chromium).
- A heartbeat is saved every second to `ytch-focus-active-v1`. On reload the page being gone counts
  as leaving at the last heartbeat, so the engine's grace/strike/away rules decide if it survives.
- Finished sessions are appended once to `ytch-focus-log-v1` (`SessionRecord`, includes `countedMs`
  after the 10 min minimum and 12 h daily cap). Home and summary derive today/total/rank from it.
- The focus screen shares watched flags, resume positions and last video with the Library through
  `src/lib/playback.ts` (direct localStorage), and reuses `Player` and `Notepad`.
- No voluntary pause; "End session" opens an in-page confirm (never `window.confirm`, which would
  steal focus and count as leaving).

## Merged Focus + Library page (still on branch `focus-screen`)

Supersedes the routes and setup screen described above:

- Nav is **Focus / Pages / Todos**. `/` is the Library (courses sidebar, player, notes, notepad) with a
  **focus bar** (`src/focus/FocusBar.tsx`) under the stats bar; `/library` redirects to `/`.
- The focus bar starts a session on the video currently selected in the sidebar; the chosen length is
  remembered in `ytch-focus-length-v1`. `FocusView` renders `VideosView` when idle and swaps in the
  countdown, locked screen or summary while a session exists. The old `FocusSetup` screen is gone.
- `.d.ts` files next to `Player.jsx` and `useLocalStorage.js` give those JS modules types for TS callers.

## Accounts and profile (branch `profile-auth`)

- **Email + username + password** accounts through Supabase Auth (no Google). Setup steps and the
  SQL for the `profiles` and `focus_sessions` tables are in `supabase/README.md` and `supabase/schema.sql`.
  Env vars `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` live in git-ignored `.env.local`
  (template: `.env.example`). Without them the app runs guest-only and `/login` explains why.
- `src/lib/supabase.ts` (client or null), `src/auth/` (`AuthProvider`, `useAuth`, `AccountNav`,
  `validation.ts`), `src/views/AuthView.tsx` (`/login`), `src/views/ProfileView.tsx` (`/profile`,
  redirects to `/login` when signed out). Nav shows "Log in" or "Profile".
- Finished sessions still go to the local log first. When signed in, `FocusView` also uploads each
  one (`src/profile/cloud.ts`, idempotent on `user_id + local_id`). The profile reads from the cloud and
  offers an "Import them" banner for sessions recorded on this device before login.
- Profile stats are pure (`src/profile/stats.ts`): today / 7 / 30 days / total hours, rank progress,
  streak, last-7-days bars. Counted hours come from the browser, so they are not tamper-proof yet.
- Not built yet: public profile page, heatmap, "currently watching", username change, password reset.
