# Architecture

## Source map

```
src/
  main.jsx                    # createRoot + StrictMode, imports index.css, renders <App/>
  App.jsx                     # top bar + tab switching; owns todos state and the active view
  App.css                     # all component styles (~1500 lines, sectioned by comments)
  index.css                   # design tokens (:root vars), resets, focus ring, scrollbars
  data/playlists.js           # generated catalogue: export const PLAYLISTS = [...]
  hooks/
    useLocalStorage.js        # useState persisted to localStorage (JSON)
    usePages.js               # shared "pages" store for Sami Labs + Notepad; legacy migration
  lib/
    utils.js                  # duration parsing/formatting and progress math
    workspace.js              # GENERAL_TOPIC, TOPIC_OPTIONS, topicName, newId, formatTimestamp
  views/
    VideosView.jsx            # the big one (~540 lines): state, sidebar, study layout
    ThoughtsView.jsx          # multi-page writing UI
    TodosView.jsx             # todos UI
  components/
    Player.jsx                # YouTube IFrame API wrapper
    NotesPanel.jsx            # per-video notes list + composer
    AllNotesModal.jsx         # all notes grouped by playlist, Esc closes, click to jump
    Notepad.jsx               # compact page editor beside the video (uses usePages)
    TopicSelect.jsx           # <select> of General + each playlist (for todos)
```

## Component tree

```
App
├─ header.topbar (brand + nav tabs, todo badge)
└─ .app-body
   ├─ VideosView
   │   ├─ stats bar (progress, Autoplay/Auto-mark toggles, Hide courses, All notes, Export)
   │   ├─ aside.sidebar (Courses / Misc groups of playlist cards, search, video list)
   │   ├─ section.content > .study (CSS grid, var --notes-w)
   │   │    ├─ .study-video: Player, video-info (+Prev/Watched/Next/YouTube link), NotesPanel
   │   │    ├─ .study-resizer (role=separator, pointer drag + arrow keys, dblclick resets)
   │   │    └─ .study-notes: Notepad
   │   └─ AllNotesModal (conditional)
   ├─ ThoughtsView
   └─ TodosView (todos, setTodos passed from App)
```

Only the active tab's view is mounted. Switching tabs **unmounts** VideosView,
which is why `saveProgress` also writes to localStorage directly (see below).

## State ownership

- `App`: `view` (`ytch-view-v1`) and `todos` (`ytch-todos-v1`). Todos live in App
  only so the nav badge can count open ones.
- `VideosView`: `watched`, `notes`, `positions`, `settings`, `sidebarOpen`,
  `notesWidth` (all persisted via `useLocalStorage`), plus transient `activePlaylistId`,
  `currentVideoId`, `query`, `showAllNotes`.
- `usePages()` is called independently in ThoughtsView and Notepad; they never
  mount at the same time, so each reads fresh from localStorage when mounted.
  That is how the two stay "synced" (no cross-component subscription exists).
- Full key/shape reference: [data-and-storage.md](data-and-storage.md).

## Key flows

**Select / navigate video.** `selectVideo(id)` sets `currentVideoId` and writes
`ytch-last-video`. An effect also writes `ytch-last-video#<playlistId>` so
`switchPlaylist` can restore the last video in that playlist (falls back to
first video). `goNext/goPrev` use index within the active playlist only.

**Video ends.** `Player` fires `onEnded` -> `handleEnded`: delete the saved
position for that video, mark watched if `autoMark`, advance if `autoplay`.

**Resume.** `Player` remounts its YT player whenever `videoId` changes (effect
dependency is `[videoId]` only). It starts at `startAt` (read from a ref so a
position update doesn't recreate the player). Progress is reported every 5 s
(`PROGRESS_INTERVAL_MS`), on `pagehide`, and on cleanup, but **only when the
player state is PLAYING or PAUSED** so loading/seeking times never overwrite a
real position. `saveProgress` in VideosView ignores positions < 1 s and writes
`ytch-positions-v1` directly to localStorage (bypassing React state) so the
write survives unmount, then also updates state.

**Player fallback.** If the IFrame API script fails to load, a plain
`youtube-nocookie` iframe is injected (still autoplays and honors `start`, but
no autoplay-next, auto-mark, or progress tracking).

**Resizable split.** `notesWidth` (default 380, min 280) is applied as CSS var
`--notes-w`. Max is container width minus 360 (video min). Drag uses window
`pointermove/pointerup`; keyboard ←/→ moves 24 px steps. Hidden under 900 px.

**Pages (Sami Labs + Notepad).** Page = `{ id, title, body, ts }`. Editing bumps
`ts`. `usePages` seeds from the legacy single-page key on first load, else one
empty page. New pages are prepended. Only ThoughtsView can delete pages
(with `window.confirm`); Notepad can create and edit but not delete.

**Todos.** `{ id, text, topic, done, ts }`; `topic` is a playlist id or
`"general"`. `topicName` falls back to "General" for unknown ids.

**Notes export.** `exportAll` (in VideosView) builds a `.txt` of all notes across
playlists and downloads it via a Blob + temporary anchor.

## Helpers (src/lib/utils.js)

`parseLength("1:21:09") -> seconds` (null if unparseable), `formatSeconds`,
`totalSeconds(playlist)`, `percentDone(playlist, watched)`,
`overallProgress(playlists, watched)`, `totalMinutes(playlists)`.
Video `length` strings are `"MM:SS"` or `"H:MM:SS"`.

## Responsive behavior

One breakpoint at `max-width: 900px` (end of `App.css`): sidebar becomes a
stacked block (max 60 vh), study grid collapses to one column, resizer hidden,
notepad becomes 60 vh tall.
