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
