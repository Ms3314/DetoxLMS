# Course Hub · YouTube Playlists + Notes

A dark-themed React app for finishing YouTube course playlists:
embedded video player, watch tracking, and per-video notes.
Playlists are grouped into **Courses** (the main ones) and **Misc**.

| Playlist | Videos | Channel | Section |
| --- | --- | --- | --- |
| [LLM Evaluation](https://www.youtube.com/playlist?list=PLEneLIDJFpcA) | 19 | CampusX | Courses |
| [FastAPI Tutorials](https://www.youtube.com/playlist?list=PL-osiE80TeTsak-c-QsVeg0YYG_0TeyXI) | 19 | Corey Schafer | Courses |
| [LLM Evals](https://www.youtube.com/playlist?list=PLgIaq8VgndJvt-HKMHPXehyJNNXQsAVHD) | 33 | Hamel Husain | Misc |

## Features

- 🎬 **Embedded YouTube player** (privacy-enhanced `youtube-nocookie` embed) with
  the IFrame API — videos start on select
- ▶️ **Autoplay next** — when a video ends, the next one starts automatically (toggleable)
- ✔ **Watch tracking** — mark videos watched manually, or let **Auto-mark** set it
  when a video finishes. Progress shown per playlist and overall in the header
- 📝 **Notes per video** — timestamped notes saved to `localStorage`; append with
  ⌘/Ctrl+Enter; delete or export them all as a `.txt` file
- 📚 **All notes modal** — browse every note across both playlists and jump back
  to the video it belongs to
- 🔎 **Search** within a playlist
- ⌨️ **Keyboard nav** — `←` / `→` to go to the previous/next video
- 🌙 **Dark theme** throughout, responsive layout

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (production build → `dist/`), `npm run preview`,
`npm run lint`.

## Project structure

```
src/
  data/playlists.js        # playlist + video metadata (fetched from YouTube)
  components/
    Player.jsx             # YouTube IFrame API embed w/ onEnded detection
    NotesPanel.jsx         # per-video notes editor
    AllNotesModal.jsx      # global notes overview
  hooks/useLocalStorage.js # persisted state hook
  lib/utils.js             # duration/progress helpers
```

> Note: playlist data was fetched from YouTube at build time. To refresh it,
> re-run the extraction against YouTube's `youtubei/v1/browse` API
> (`browseId: VL<playlistId>`) and regenerate `src/data/playlists.js`.