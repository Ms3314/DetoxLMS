# Gotchas and conventions

## Stale or suspect things (verified against code at `6fd913d`)

- **Root `README.md` is partly stale.** It says "both playlists", describes only
  Player/NotesPanel/AllNotesModal, omits Sami Labs / Todos / Notepad / resume / the
  TopicSelect and `usePages`/`workspace` files, and its structure tree is incomplete.
  Trust the code and this folder. Its playlist table is current (5 playlists).
- **`index.html` `<title>`** reads "Sami Labs · Videos, Sami Labs & Todos" (a bulk rename left
  "Sami Labs" duplicated; probably meant "Thoughts"). Internal id/file names still say
  "thoughts" (`ThoughtsView`, `ytch-thoughts-*`, tab id `thoughts`) while the UI label is "Sami Labs".
  Don't rename storage keys for this.
- **LLM Evaluation playlist id `PLEneLIDJFpcA`** is only 13 chars; real YouTube playlist ids
  are longer, so the URL/id may be truncated. Changing it would orphan todo topics and the
  `ytch-last-video#<id>` key, so verify before touching.
- **README says the embed is `youtube-nocookie`**, but the normal path loads
  `youtube.com/iframe_api` and creates a standard `YT.Player`; nocookie is used only by the fallback iframe.
- **`DEFAULT_KEY = "ytch-last-video"`** has a misleading comment ("not used as watched store,
  used for resume"); it stores the last-opened video id as a raw string, not JSON.
- **Note identity uses timestamp `ts`**; duplicate-ms notes would collide on key/delete.
- **`useLocalStorage` reads once** at mount: two components using the same key at the same time
  will not see each other's writes. Sami Labs and Notepad avoid this only because they are never
  mounted together.
- **Unmount-time state updates are dropped**, so anything that must be saved when leaving the Videos
  tab (playback position) is written straight to `localStorage` as well as state.
- `VideosView.jsx` carries an `eslint-disable-next-line react-hooks/exhaustive-deps` comment, but the
  linter is oxlint (only `rules-of-hooks` + `only-export-components` enabled).
- `dist/`, `.vercel/`, `node_modules/` are git-ignored; do not commit them.
- Large generated file: avoid reading all of `src/data/playlists.js` (1.6k lines); grep or read ranges.

## Conventions

- Plain JS + JSX with ES modules, function components, hooks only. Default export per component/view;
  named exports for hooks and lib helpers.
- 2-space indent, double quotes (except `main.jsx`/`vite.config.js` from the Vite template, which use
  single quotes and no semicolons). Match the file you're editing.
- Doc comments (`/** ... */`) above components and non-obvious helpers explaining *why*; keep that style.
- State: local `useState` for UI; `useLocalStorage` for anything persisted; lift state only when two
  siblings need it (as with todos for the nav badge).
- Storage keys: `ytch-<name>-v1`; never change an existing key's shape without migrating.
- No test suite or CI; before finishing a change run `npm run lint` and `npm run build`, then exercise the UI in
  `npm run dev` (playback resume, tab switching, and persistence across reload are the fragile paths).
- Git: short imperative commit subjects; features landed through PRs from branches
  (`sami-labs-revamp`, `study-split-view`, `resume-playback`), playlist additions as direct commits on `main`.

## Common tasks, where to start

| Task | Start in |
| --- | --- |
| Add/rename a playlist | `src/data/playlists.js`, then root README table |
| Change the player/resume/autoplay behavior | `src/components/Player.jsx`, `handleEnded`/`saveProgress` in `VideosView.jsx` |
| New top-level section | `SECTIONS` + conditional render in `src/App.jsx`, new `src/views/*View.jsx`, styles in `App.css` |
| New persisted setting | `useLocalStorage` in the owning component + document the key in `data-and-storage.md` |
| Restyle | tokens in `src/index.css`, rules in `src/App.css` |
| Todo topics | `src/lib/workspace.js` (`TOPIC_OPTIONS` derives from `PLAYLISTS`) |
