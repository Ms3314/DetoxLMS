# Data and storage

There is no backend. Two kinds of data:

1. **Static catalogue**: `src/data/playlists.js` (committed, generated).
2. **User state**: browser `localStorage` (per browser/device, not synced, not exported except notes `.txt`).

## 1. Catalogue shape (`PLAYLISTS`)

```js
{
  id: "PL...",                  // YouTube playlist id; also used as the topic id for todos
  name: "LLM Evaluation",       // display name
  url: "https://www.youtube.com/playlist?list=PL...",
  group: "Courses" | "Misc",    // sidebar grouping; missing => treated as "Courses"
  lectureLabels: true,          // optional: sidebar shows "Intro", "Lecture 1".. instead of titles
  videos: [
    { id: "<11-char video id>", title, channel, length: "H:MM:SS" | "MM:SS", thumb: "https://i.ytimg.com/vi/<id>/hqdefault.jpg" }
  ]
}
```

Current contents (order = sidebar order within group; first playlist is the default):

| Playlist | Videos | Group | Notes |
| --- | --- | --- | --- |
| LLM Evaluation (CampusX) | 19 | Courses | id is `PLEneLIDJFpcA`, which looks truncated (see gotchas) |
| FastAPI Tutorials (Corey Schafer) | 19 | Courses | |
| Computer Vision from Scratch (Vizuara) | 71 | Courses | `lectureLabels: true` |
| LLM Evals (Hamel Husain) | 33 | Misc | |
| What Is Sami Learning (CampusX) | 84 | Courses | renamed from "100 Days of Deep Learning" |

Totals are computed at runtime (`TOTAL_VIDEOS`, `totalMinutes`), never hardcoded.

**Video ids are the primary key for all user state** (watched, notes, positions).
Changing or removing a video id orphans the user's data for it. Playlist ids are
the key for todo topics and `ytch-last-video#<id>`.

## 2. localStorage keys

All keys are prefixed `ytch-` (legacy name "yt course hub"). Values are JSON unless noted.
`useLocalStorage` reads once on mount and writes on every change; failures are swallowed.

| Key | Owner | Shape | Notes |
| --- | --- | --- | --- |
| `ytch-view-v1` | App | `"videos" \| "thoughts" \| "todos"` | Unknown value falls back to `videos` |
| `ytch-todos-v1` | App | `[{ id, text, topic, done, ts }]` | `topic` = playlist id or `"general"` |
| `ytch-watched-v1` | VideosView | `{ [videoId]: true }` | Unwatching deletes the key |
| `ytch-notes-v1` | VideosView | `{ [videoId]: [{ ts, text }] }` | `ts` (ms epoch) is also the React key and delete handle, so two notes in the same ms would collide |
| `ytch-positions-v1` | VideosView | `{ [videoId]: seconds }` | Integer seconds >= 1; removed when video ends |
| `ytch-settings-v1` | VideosView | `{ autoplay: bool, autoMark: bool }` | Defaults both `true` |
| `ytch-sidebar-open-v1` | VideosView | `bool` | Courses sidebar visibility |
| `ytch-notes-width-v1` | VideosView | `number` (px) | Notepad column width, default 380 |
| `ytch-last-video` | VideosView | **raw string** (not JSON) video id | Read/written directly via `window.localStorage` |
| `ytch-last-video#<playlistId>` | VideosView | **raw string** video id | Last video per playlist |
| `ytch-thoughts-pages-v1` | usePages | `[{ id, title, body, ts }]` | Shared by Sami Labs tab and Notepad |
| `ytch-thoughts-page-v1` | usePages | `{ title, body }` | Legacy single page; read-only migration source |

Rules of thumb:
- Existing keys must keep their names/shapes so users' saved progress carries over
  (the code comments call this out explicitly). Add a new `-v2` key plus a migration
  rather than changing a shape in place.
- New persisted state => `useLocalStorage("ytch-<thing>-v1", default)`.
- `newId()` (in `lib/workspace.js`) generates ids for pages/todos: base-36 timestamp + random suffix.
- Pages and todos are not cross-device; clearing site data deletes everything. Only
  video notes have an export (`Export` button -> `course-notes.txt`).
