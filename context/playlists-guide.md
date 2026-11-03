# Playlists guide: adding, renaming, refreshing

`src/data/playlists.js` is generated data, not hand-written logic. It is a single
`export const PLAYLISTS = [ ... ]` with JSON-style (double-quoted, `\uXXXX`-escaped) entries.

## Add a playlist

1. Get the YouTube playlist id (`list=` value) and its videos' id, title, channel, duration.
   The README documents the original method: call YouTube's `youtubei/v1/browse`
   API with `browseId: "VL<playlistId>"` and map the results.
2. Append an object to `PLAYLISTS` following the shape in [data-and-storage.md](data-and-storage.md).
   - `thumb` = `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg`
   - `length` as `"MM:SS"` or `"H:MM:SS"` (parsed by `parseLength`).
   - `group`: `"Courses"` (main) or `"Misc"`.
   - `lectureLabels: true` only for numbered lecture series where video 0 is an intro.
3. Run `npm run dev`; the new playlist appears in the sidebar and in the Todos topic dropdown
   automatically (`TOPIC_OPTIONS` is derived from `PLAYLISTS`). Progress totals update on their own.
4. Update the table in the root `README.md` (it lists every playlist).

Commit style used so far: one commit per playlist, e.g.
`Add 100 Days of Deep Learning playlist (84 videos, CampusX)`.

## Rename a playlist

Change `name` only. Keep `id` (it keys todo topics and last-video state). Rename
commit precedent: `6fd913d`.

## Reorder

Array order is sidebar order inside each group. The **first** playlist's first
video is the app's default on a brand-new browser.

## Refreshing data

Re-fetch and regenerate the whole file if titles/durations change. Preserve each
existing video `id` so users' watched flags, notes and positions still match.

## The Excel file

`Computer_Vision_from_Scratch_Lectures.xlsx` (tracked at repo root) is a spreadsheet
export of the Vizuara CV course: sheet `Lectures` (columns: Lecture, Lecture #, Full Video
Title, Duration, Watch Link, Video ID, 72 rows including header = Intro + 71 lectures per
the About sheet) and an `About` sheet (channel, playlist URL, total videos 71). It is a
reference/source artifact; the app does not read it at runtime.
