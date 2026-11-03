# Overview

## What it is

A personal, dark-themed hub for working through YouTube course playlists.
Brand shown in the UI: **Sami Labs** (npm package name: `yt-course-hub`; the
GitHub owner is `Ms3314`, per merged PR history).

Sections (top-bar tabs, defined in `src/App.jsx`):

| Tab | View | Purpose |
| --- | --- | --- |
| Videos | `src/views/VideosView.jsx` | Playlist sidebar, embedded player, progress, per-video notes, notepad beside the video |
| Sami Labs | `src/views/ThoughtsView.jsx` | Multi-page free writing ("blank page" editor with a pages list) |
| Todos | `src/views/TodosView.jsx` | Todo list, each optionally tagged with a course topic; open/done/all filter |

The tab badge on Todos shows the count of open todos.

## Features in the Videos view

- Embedded YouTube player (IFrame API, `youtube-nocookie` fallback iframe).
- Autoplay next video on end (toggle) and auto-mark watched on end (toggle).
- Manual watched toggle per video; per-playlist and overall progress bars.
- Resume playback position per video (saved every 5s and on tab close/unmount).
- Per-video timestamped notes (`NotesPanel`), "All notes" modal across all
  playlists with jump-to-video, and plain-text export (`course-notes.txt`).
- Search within the active playlist (title or channel).
- Keyboard: `←` previous, `→` next (disabled while typing; `→` ignored when autoplay is on).
- Collapsible courses sidebar; draggable/keyboard-resizable divider between video and notepad.
- Notepad beside the video shares pages with the Sami Labs tab.

## Stack

- React 19, react-dom 19 (plain JS/JSX, ES modules, no TypeScript).
- Vite 8 + `@vitejs/plugin-react`; `vite.config.js` is just the plugin.
- Lint: `oxlint` (`.oxlintrc.json`: react + oxc plugins; `rules-of-hooks` = error,
  `only-export-components` = warn).
- No router, state library, UI kit, test framework, or backend.
- Fonts: Geist and Geist Mono from Google Fonts (linked in `index.html`).
- External runtime dependency: `https://www.youtube.com/iframe_api`, plus
  `i.ytimg.com` thumbnails referenced from the data file.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # production build -> dist/ (git-ignored)
npm run preview   # serve the built dist/
npm run lint      # oxlint
```

There are no tests; verify changes by running the dev server and exercising the UI.

## Deployment

`.vercel/` exists locally (git-ignored), meaning the project is linked to Vercel.
`dist/` is the build output. Nothing else (no CI config, no env vars) is in the repo.

## Repo layout (top level)

```
index.html                 # title, fonts, theme-color, mounts #root
package.json, vite.config.js, .oxlintrc.json
public/                    # favicon.svg, icons.svg
src/                       # all app code (see architecture.md)
context/                   # this folder
Computer_Vision_from_Scratch_Lectures.xlsx   # source list for the CV course (see playlists-guide.md)
README.md                  # user-facing readme (partly stale, see gotchas-and-conventions.md)
```

## History (short)

`f410c4d` original Course Hub -> `c2415e9` added Computer Vision course ->
`89fa9f9` "Signal Dark" revamp, split into Videos / Sami Labs / Todos ->
`c5848c0`..`aee90d1` notepad beside video, collapsible sidebar, resizable split ->
`5d21e02`..`5c45243` resume playback -> `ef5451d`/`6fd913d` added then renamed the
84-video CampusX playlist to "What Is Sami Learning".
