# Plan: Sami Labs becomes a Focus Platform

Status: **DRAFT v1, awaiting answers.** Every section ends with open questions (`Q#`)
and a recommended default (marked **Default**). Answer them and I fold the
decisions back into this file, so it stays the single source of truth.

---

## Decisions log (locked answers)

| Q | Decision | Consequence |
| --- | --- | --- |
| Q1 | **Feels locked, leaves penalised** (tiers B+C+D) | Pure web for MVP 1; Chromium gets Esc capture, others degrade to plain fullscreen. Desktop/extension lock deferred to Phase 6 |
| Q39 | **YouTube-course focus only** | Every focus session is tied to a playlist/video; no "free focus" mode. Q8 is therefore effectively "no" (see below). Pages/PDF/coding focus is out of scope |
| Q25 | **Supabase** (Postgres + Auth + RLS) | Frontend stays React/Vite on Vercel; server logic in Supabase Edge Functions |
| Q6 | **You and friends first** | Lighter security/polish in early phases; still validate time server-side before any shared leaderboard |

| Q9 | **Count-down (25/45/60/90/custom) + open-ended**; Pomodoro later | Timer engine supports a target or none; breaks are a later iteration |
| Q11 | **10 s grace, then pause + log away time**; 3 strikes or 2 min total away fails the session | Leave detector + strike counter are core Phase 1 logic; unit-test them |
| Q14 | **Min 10 focused min counts; bonus for reaching target** | Sessions under 10 focused min earn nothing; completion adds a bonus (formula in section 4) |
| Q56 | **React Router now; incremental TypeScript for new code** | Replace tab state with routes (`/focus`, `/library`, `/profile`, ...); new files `.ts/.tsx`, old ones migrate gradually |

| Q12 | **No voluntary pause** | Only "End session" exists; any absence goes through the leave rules. Bathroom break = leave + grace + log. Revisit if testers complain |
| Q19 | **Hours only, no points** | Profile ranks on hours and streaks. NOTE: your first message said "focus points"; see Q65, I need to confirm whether points are dropped entirely or just not v1 |
| Q7 | **Keep the existing app; Focus becomes the home screen** | Routes: `/` Focus (home), `/library` (current Videos), `/pages` (Sami Labs), `/todos`, later `/profile` |
| Q34 | **Shared cache keyed by YouTube playlist id + shareable "collections"** (your idea) | See section 6: a playlist is imported once and cached for everyone; curated catalogs ("Sami's collection", "Karpathy's collection") group playlists and can be shared |

| Q65 | **Hours are the score**; rank titles earned from hour thresholds | No points table or ledger. Profile = hours, streaks, rank. Rank thresholds still to define (Q71) |
| Q66 | **Every user can create collections; private by default** (link-only or public are opt-in) | `collections.visibility` defaults to `private` |
| Q26 | **Google + email magic link** | Supabase Auth providers: Google OAuth and OTP email. No passwords stored |
| Q28 | **Private profile by default; public is opt-in** at `/u/<handle>`; notes, pages and todos never public | `users.is_public` defaults false; public view exposes only the fields the user ticks (Q29) |

| Q27 | **Guest mode allowed, with limits** | Guests can focus and use the fixed/public collections others use, with all data stored locally. Guests **cannot import their own playlists** (that needs an account, since import hits the YouTube API quota and writes to the shared cache). Signing up later offers a one-time import of local sessions |
| Q29 | **All four are opt-in public fields**: hours/rank/streak, activity heatmap/charts, current playlists, own collections | Per-field toggles on the profile; everything else stays private |
| Q47 | **No leaderboard in v1; later, friends/link-group scope only** | No global ranking, so anti-cheat can stay light until groups exist |
| Q40 | **Camera presence: optional, browser-only, face-present** | MediaPipe in the browser, nothing recorded or uploaded; verified sessions get a "verified" flag. Detection of gaze/phone/drowsiness not in this MVP |

| Q52 | **Study layout with a prominent timer** | Focus screen reuses video + notepad; adds a big timer ring and today's total, with a toggle to timer-only |
| Q23 | **Strict daily streak** | A day counts with at least one valid session (10+ focused min); missing a day resets to 0. No freeze tokens |
| Q57 | **Vitest unit tests for logic + Playwright for the focus flow** | Timer engine, leave rules, hour/streak math are pure and tested; e2e covers start, leave, resume, end |
| Q15 | **Silent summary screen at the end** | No chime, no browser notification permission. Summary shows focused/away time, strikes, videos watched, streak; exits fullscreen |

| Q51 | **Product name: DetoxLMS** (replaces "Sami Labs" as the brand) | Update brand text, `index.html` title/description, README; keep it in one constant. Internal storage keys (`ytch-*`) stay unchanged. Open: Q76 |
| Q50 | **Nav: Focus / Library / Pages / Todos / Profile** | Focus is landing; Profile shown to signed-in users. "Sami Labs" tab is relabelled "Pages" |
| Q31 | **Vercel + Supabase free tiers** | $0 budget; note Supabase free projects pause after inactivity and have no backups; revisit before wider launch |
| Q61 | **I build in PR-sized milestones; you review and test** | Each milestone = a branch + PR with a short test checklist |

| Q62 | **Fastest working version first; no fixed date** | Phase 1 milestones ordered so a usable focus session exists after the first few PRs; polish later |
| Q3 | **Chromium first, others degrade** | Chrome/Edge/Brave/Arc get Esc capture (Keyboard Lock); Safari/Firefox get plain fullscreen plus a notice that the lock is weaker |
| Q2 | **Desktop-first, mobile basic** | Mobile: timer + leave detection only, responsive layout, no real fullscreen lock |
| Q30 | **Simple privacy page + account deletion + data export** | Required before accounts go live (Phase 2); fuller terms before any public launch or the camera feature |

| Q64 | **Playlist ends before timer: prompt to pick another playlist or keep going with notes** | Timer keeps running; an end-of-playlist card appears. Playlist switch must not end the session |
| Q-refresh (call it **Q78**) | **Refresh/close mid-session: `beforeunload` warning; on return, resume if within 2 min, else failed** | Session snapshot persisted (localStorage for guests, DB for users) with a heartbeat timestamp; away time counts as away |
| Q17 | **Autoplay-next follows the existing Autoplay toggle** | Same `ytch-settings-v1.autoplay`, default on |
| Q13 | **No breaks in v1; end the session to rest** | Consistent with no voluntary pause (Q12). Pomodoro/breaks later and never count as focus |

| Q79 | **Failed sessions count toward hours, not streak** | Hours ledger includes focused minutes of failed sessions (flagged `failed`); streak only counts `completed` sessions. Assumed: the 10-min minimum from Q14 still applies to hours (see Q81) |
| Q33 | **Playlists and single videos** | Videos become a first-class table independent of playlists; a user's "Singles" list holds standalone videos. Focus sessions can target a playlist or a single video |
| Q37 | **20 playlists per user, 500 videos per playlist** | Enforced in the import server function; adjustable via config |
| Q70 | **Manual refresh button, rate-limited** (once per day per playlist) | Store `last_refreshed_at` on the shared playlist; no background job in v1 |

| Q81 | **10-minute minimum applies to hours too** | Sessions under 10 focused min add 0 hours (still stored in history for debugging) |
| Q24 | **Profile shows**: hours (today/week/month/total) + rank + streak; activity heatmap + weekly chart; currently watching + progress | "Recent sessions list" was not selected, so it is out of v1 (cheap to add later from `focus_sessions`) |
| Q82 | **Singles: shared cache by video id, 100 per user, embeddable check** | Same import path as playlists |
| Q58 | **Sentry errors only** | No behavior analytics, no cookies; never send camera data or note contents to Sentry (scrub breadcrumbs) |

| Q59 | **No CI yet** | Run `npm run lint`, `npm run build` and tests locally before each PR; Vercel preview deploys still come with the existing Vercel link. Revisit when others contribute |
| Q22 | **12 counted hours per day** | Extra time is logged but not counted toward hours/rank |
| Q71 | **Ranks: Starter 0h, Focused 10h, Dedicated 50h, Scholar 150h, Master 500h, Sage 1000h** | Pure function of total counted hours |
| Q42 | **Camera absence: warn 10 s, pause 30 s, fail after 2 min cumulative** | Applies in MVP 2; reuses the leave-rule state machine |

Answered by the above: Q81, Q82. Remaining new follow-ups: Q83, Q84.

New questions from these answers:
- **Q81.** Does the 10-minute minimum apply to hours too? i.e. a failed or short session under 10 focused minutes adds 0 hours. **Default:** yes, under 10 min adds nothing.
- **Q82.** Single videos: shared cache keyed by YouTube video id (like playlists), limited to 100 singles per user? Same embeddable check as playlists? **Default:** yes to all three.
- **Q83.** Can single videos be placed in collections alongside playlists? **Default:** yes, a collection item is a playlist or a video.
- **Q84.** Very long videos (3h+ lectures): any special handling for sessions shorter than the video (e.g. resume position across sessions)? **Default:** reuse the existing resume-position feature.
- **Q79 (superseded above).** A failed session still logs the minutes actually focused; do those minutes count toward hours and streaks? **Default:** yes if 10+ focused min (consistent with Q14), flagged as failed.
- **Q80.** Is the heartbeat for the 2-minute resume window enough, or must resume also re-verify fullscreen (the user must click to re-enter, since fullscreen needs a gesture)? **Default:** resume screen with a "Re-enter focus" click; time between reload and click counts as away.
- **Q76.** Domain: do you have one for DetoxLMS (e.g. detoxlms.com), or use the Vercel default URL for now? Also logo/tagline? **Default:** Vercel URL, text wordmark.
- **Q77.** "Sami's collection" naming: keep your name on the seed collection, or rename to match the brand (e.g. "DetoxLMS Picks")? **Default:** keep "Sami's collection".
- **Q72.** Which collections do guests see: only official ones you curate, or any public collection? **Default:** official + public ones; guest progress is local to the device.
- **Q73.** When a guest signs up, do their local watched/notes/sessions import automatically or on a prompt? **Default:** prompt, one time, per-device.
- **Q74.** Are "link groups" (Q47) invite links to a private group with its own weekly hours board? **Default:** yes, when we build social.
- **Q75.** The "verified" flag: does it only decorate the session, or does it change what counts toward hours/rank (e.g. rank hours need verified sessions)? **Default:** decorative only for now.

New: **Q71.** What are the rank names and hour thresholds? **Default:** Starter 0h, Focused 10h, Dedicated 50h, Scholar 150h, Master 500h, Sage 1000h.

Still open: everything else below (Q2-Q5, Q10, Q13, Q15-Q18, Q20-Q38 except those above, Q40-Q55, Q57-Q65 and the new ones in section 6).

---

## 0. The vision in one paragraph

People open the site, pick what they are studying (a YouTube course playlist, or
nothing), and press **Start focus**. The screen goes into a locked, full-screen
focus mode with a running timer. When the session ends they earn **focus
points**. A **profile** shows total hours focused, points, streaks, and the
videos/playlists they are working through. Later (MVP 2) the webcam checks the
person is actually there, and pauses or fails the session if not.

What exists today (see `context/`): a client-only React app with playlists
(hard-coded), player, notes, notepad, todos. No backend, no accounts, no timer.

---

## 1. The most important truth: what "lock the entire screen" can mean on the web

A website **cannot** truly lock a computer. Browsers deliberately forbid it.
What a web page can do, strongest to weakest:

| Tier | Technique | What it blocks | What it cannot stop |
| --- | --- | --- | --- |
| A. Soft | Full-screen overlay + timer in the page | Nothing real, just a UI | Switching tabs/apps |
| B. Fullscreen | Fullscreen API (needs a click to start) | Hides tabs, address bar, taskbar on most OSes | Esc exits it; Alt/Cmd-Tab still works |
| C. Fullscreen + Keyboard Lock | `navigator.keyboard.lock(['Escape', ...])` (Chromium only; must be fullscreen; user holds Esc to exit) | Makes single-press Esc not exit | Cmd/Ctrl-Tab, Alt-Tab, OS shortcuts, Cmd-Q |
| D. Detect + penalise | `visibilitychange`, `blur`, `fullscreenchange`, `beforeunload` | Nothing, but you *know* they left and can pause, warn, or fail the session | Cheating on a second device |
| E. Hard lock | Desktop app (Electron/Tauri kiosk mode) or browser extension that blocks other tabs/sites | Much more (other sites, apps with OS APIs) | Still not an OS lock; user can force-quit |
| F. OS-level | Native apps (Cold Turkey, Freedom style) | Almost everything | Needs install + admin permissions |

**Honest recommendation:** MVP 1 = tiers B + C + D. It *feels* locked,
and exits are *recorded and penalised*, which is what actually creates
focus (accountability), not true blocking. Tier E is a later opt-in for power users.

> A big design consequence: because we can't prevent leaving, the product must
> define what happens when someone leaves. That rule set (section 4) matters more than the lock.

Open questions:
- **Q1.** Is "feels locked + leaves are detected and penalised" acceptable for MVP 1,
  or must it be a real hard lock (which means building a desktop app or extension first)? **Default:** soft+detect for web MVP; extension/desktop later.
- **Q2.** Should the lock apply on mobile browsers too? (Fullscreen/keyboard lock barely work there.) **Default:** desktop-first, mobile gets tier A+D only.
- **Q3.** Which browsers must work? Keyboard Lock is Chromium-only (Chrome, Edge, Brave, Arc); Safari/Firefox degrade to tier B. **Default:** Chromium first, others degrade gracefully with a notice.

---

## 2. Product scope and phases

| Phase | Name | Delivers | Needs backend? |
| --- | --- | --- | --- |
| 1 | **Focus Core (MVP 1a)** | Focus session: start, locked fullscreen, timer, pause rules, end, local session log | No (localStorage) |
| 2 | **Accounts + Profile (MVP 1b)** | Sign up/in, profile page, hours + points, session history synced across devices | Yes |
| 3 | **Bring your own playlists** | User adds playlist URL; app fetches videos; per-user progress/notes | Yes |
| 4 | **Presence detection (MVP 2)** | Webcam: is a person there? pause/fail on absence | Mostly client-side |
| 5 | **Social + growth** | Leaderboards, friends, public profiles, badges | Yes |
| 6 | **Hard lock** | Desktop app / extension | Separate build |

Open questions:
- **Q4.** Is this order right? In particular: do you want accounts *before* the CV feature (my default) or the other way round?
- **Q5.** Do you want to ship Phase 1 publicly on its own first (fast feedback), or keep building until profiles exist?
- **Q6.** Who are the first users: just you and friends, a class/college cohort, or the public? This changes how much security and polish Phase 2 needs.
- **Q7.** Is the existing "Videos / Sami Labs / Todos" app kept as-is inside the new product, or does the focus experience replace the home screen?

---

## 3. Phase 1: Focus Core (details)

### 3.1 Session flow (state machine)

```
idle -> setup -> countdown(3s) -> focusing <-> paused -> completed
                                      \-> abandoned (quit / left too long / timeout)
```

Setup choices: duration, what you are working on (playlist/video/free-form
label), optional goal text ("finish lectures 5-8"). Then **Start** (the click is
required anyway to allow fullscreen).

During `focusing`:
- Fullscreen on, Esc captured where supported (tier C).
- Big timer (count-up, count-down, or both: see Q9).
- Minimal chrome: the current video (if any) and the notepad stay usable;
  everything else (nav, todos, other playlists) hidden.
- Leave detection (tab hidden, window blurred, fullscreen exited) starts a grace timer.
- Exit path is deliberate: "End session" button with confirm, or hold-Esc.

### 3.2 Timer modes

- **Fixed (count-down):** 25 / 45 / 60 / 90 / custom minutes.
- **Open-ended (count-up):** run until you stop.
- **Pomodoro cycles:** focus N min, break M min, repeat (breaks unlock the screen).
- Timer must use timestamps (`Date.now()` deltas), not interval counting, so a
  throttled background tab or sleeping laptop doesn't corrupt it.

### 3.3 Leaving rules (the heart of it)

Define for each event what happens:

| Event | Options |
| --- | --- |
| Exit fullscreen | (a) instantly re-prompt, (b) grace period then pause, (c) count as a strike |
| Tab hidden / window blurred | (a) pause timer, (b) keep running but record distraction time, (c) fail after X seconds |
| Page refresh / close | warn with `beforeunload`; on return offer to resume or discard |
| Computer sleeps | pause automatically, resume on wake |
| Quit button | confirm; session ends as "abandoned" (partial credit or none?) |

Default: grace of 10 s; beyond that the timer **pauses** and the away time is
logged; 3 strikes or 2 minutes total away = session failed.

### 3.4 Video inside focus mode

Locking and YouTube iframes interact: the iframe can steal keyboard focus, and
fullscreen of the page vs fullscreen of the video are different. Decision needed:
focus screen contains the player (page-fullscreen) while the page itself is the
fullscreen element.

Open questions (Phase 1):
- **Q8.** ~~Can someone focus without a video?~~ **Resolved by Q39: no.** A session requires a selected playlist (video optional to start; the session follows the playlist). Open follow-up: what if the playlist ends mid-session (see Q64)?
- **Q64.** If the playlist finishes before the timer does, what happens: session continues with notes only, prompts to pick another playlist, or ends early?
- **Q9.** Timer style: count-down only, count-up only, or user picks? Pomodoro included in MVP? **Default:** fixed count-down + open-ended; Pomodoro in a later iteration.
- **Q10.** Preset durations to offer? **Default:** 25 / 45 / 60 / 90 / custom.
- **Q11.** Leave grace period and strike rules: use my defaults above or set your own numbers?
- **Q12.** What if the user pauses on purpose (bathroom)? Allow a limited number/length of voluntary pauses per session? **Default:** 1 pause, max 5 minutes, no points during it.
- **Q13.** Are breaks part of a session (and count toward hours) or not? **Default:** breaks never count as focus time.
- **Q14.** What counts as a "completed" session: reached the target time, or any duration? Is a minimum length required to count (e.g. 10 min)? **Default:** minimum 10 min counts; completing the target gives a bonus.
- **Q15.** Sound/notification at end (and a chime)? Browser notification permission ok? **Default:** soft chime, optional.
- **Q16.** Should the UI during focus show ambient things (quote, progress ring, today's total)? **Default:** ring + elapsed + today's total only; no clutter.
- **Q17.** Keep the video's autoplay-next in focus mode? Auto-advance playlist during a timed session? **Default:** yes, same toggle as today.
- **Q18.** Should the notepad/notes stay available while locked? **Default:** yes (it is study-relevant).

---

## 4. Focus points and the hour ledger (design)

> **Update (Q19): hours only, no points.** The ledger of `focused_seconds` is the
> score. Ranking, profile stats and streaks all derive from hours. The points
> formula below is kept as a parked option in case points return (see **Q65**).
> Open: the 10-minute minimum (Q14) and the "target reached" bonus now have no
> points to attach to, so the bonus could become a "completed" badge/flag instead.

Principles: simple to explain, hard to farm, rewards consistency.

Parked formula (only if points come back):
- Base: **1 point per focused minute** (only `focusing` time, never paused/away time).
- Completion bonus: +10% if the target time was fully reached.
- Streak bonus: +5% per consecutive day with a session, capped at +25%.
- Penalties: none to total (points only go up), but failed sessions earn only
  the minutes actually focused, with no bonus.

Hour ledger = sum of `focused_seconds` across sessions (distinct from points).

Anti-cheat concerns once there are leaderboards (Phase 5):
- Timer must be validated **server-side**: client sends `start` and `end`, server
  computes duration from its own clock and rejects impossible values.
- Cap points per day (e.g. 12 h) and flag sessions with no interaction signals.
- Webcam presence (Phase 4) is the strongest signal; sessions with it can earn a multiplier.

Open questions:
- ~~**Q19.**~~ **Decided: hours only, no points.**
- **Q65.** Your first message mentioned "focus points". Are points dropped for good, deferred to a later version, or did "hours only" mean hours are the points (e.g. "1 hour = 1 point", shown as ranks)? Affects the profile and leaderboard design.
- **Q20.** Are points spendable (shop, themes, badges) or just a score? **Default:** score + badges only.
- **Q21.** Do points also reward learning actions (finishing a video, writing a note), or only focus time? **Default:** focus time only, keeps it honest.
- **Q22.** Daily cap on points/hours? **Default:** 12 h/day.
- **Q23.** Do missed days break a streak? Allow a "freeze" token? **Default:** streak breaks, 1 free freeze per week.
- **Q24.** What does the profile show exactly? Proposed: total hours, points, current/longest streak, today/week/month charts, heatmap calendar, currently-watching playlists + progress, recent sessions, badges. Cut or add?

---

## 5. Phase 2: Accounts, profile, backend

### 5.1 Why a backend is now required
Profiles, points, history across devices, and later leaderboards cannot live in
`localStorage`. Needs auth + database + server-side session validation.

### 5.2 Candidate architectures

| Option | Pros | Cons |
| --- | --- | --- |
| **Supabase** (Postgres + Auth + Row Level Security) | Fast to build, SQL, built-in Google login, realtime for leaderboards, generous free tier | Vendor-hosted; server logic via Edge Functions |
| **Firebase** (Auth + Firestore) | Very fast, great auth | NoSQL makes leaderboards/aggregations clumsier |
| **Next.js + own API + Postgres (Neon) + Auth.js/Clerk** | Full control; fits Vercel (already linked) | Most work |

**Default:** Supabase, keeping the React/Vite frontend and Vercel hosting.

### 5.3 Draft data model

```
users(id, handle, display_name, avatar_url, created_at, is_public, timezone)
focus_sessions(id, user_id, started_at, ended_at, target_seconds, focused_seconds,
               away_seconds, status[completed|abandoned|failed], points,
               playlist_id?, video_id?, label?, presence_verified bool)
session_events(id, session_id, type[blur|fs_exit|pause|resume|...], at, meta)   -- audit/anti-cheat
playlists(id, owner_id, youtube_playlist_id, title, channel, added_at, is_public)
playlist_videos(playlist_id, video_id, position, title, duration, thumb)
user_video_progress(user_id, video_id, watched, position_seconds, updated_at)
notes(id, user_id, video_id, text, created_at)
pages(id, user_id, title, body, updated_at)             -- Sami Labs pages
todos(id, user_id, text, topic, done, created_at)
points_ledger(id, user_id, session_id, points, reason, created_at)
badges / user_badges (later)
```

### 5.4 Migration of existing local data
Current users' watched/notes/positions/pages/todos live in localStorage. On
first sign-in offer "import this device's data" (one-time upload mapping the
existing keys listed in `context/data-and-storage.md`).

Open questions:
- **Q25.** Backend choice: Supabase (default), Firebase, or custom? Any provider you already pay for or prefer?
- **Q26.** Login methods: Google only, email+password, magic link, GitHub, Apple? **Default:** Google + email magic link.
- **Q27.** Is guest mode allowed (focus without account, data stays local, prompt to sign up)? **Default:** yes, so Phase 1 stays usable.
- **Q28.** Profile URL & handle: `/u/<handle>` public by default or private by default? **Default:** private by default, opt-in public.
- **Q29.** Which profile fields are public if shared: hours, points, streak, current playlists (titles), notes? **Default:** never notes/pages/todos; the rest opt-in.
- **Q30.** Age/legal: minimum age, privacy policy, terms, account deletion + data export (GDPR-style)? Required before public launch, especially once webcam is involved.
- **Q31.** Where will it be hosted and under what domain? (Vercel is already linked.) Budget ceiling per month?
- **Q32.** Do the existing Sami Labs pages and todos become per-user cloud data, or stay local-only? **Default:** cloud-synced.

---

## 6. Phase 3: user-added playlists

Today playlists are a generated, hard-coded file scraped from YouTube's
unofficial `youtubei/v1/browse` endpoint. That is fragile and not suitable for user input.

Proposed:
- User pastes a playlist URL or id. A **server function** (never the browser)
  calls the **YouTube Data API v3** (`playlistItems.list` + `videos.list` for
  durations) with our API key, stores the videos in the DB, caches per playlist
  so many users share one fetch.
- Quota: 10,000 units/day free; a 100-video playlist costs roughly 2 + 2 calls
  (a few units) so quota is fine at small scale, but needs caching/refresh policy.
- Edge cases: private/unlisted playlists, deleted/private videos, very large
  playlists (YouTube caps pages at 50), duplicate playlists, regional blocks,
  videos with embedding disabled (the iframe will fail; detect and mark).
- The 5 current playlists become "starter playlists" seeded into the DB, with
  stable ids so existing progress keeps working.
- Also needed: remove/rename a playlist, reorder, mark public/private, refresh.

### 6.1 Shared cache + collections (decided in Q34)

- **Cache by playlist id.** A YouTube playlist id is globally unique. When a user
  adds one: look it up in our `playlists` table; if it exists, link it to the
  user instantly (no API call); if new, a server function imports it from the
  YouTube Data API, stores it, and links it. One fetch serves everyone.
- **Collections** = named, curated groups of playlists, e.g. "Sami's collection",
  "Karpathy's collection". Owned by a user, with a title, description, and
  visibility (private / unlisted link / public). Others can browse, preview and
  **add a whole collection or single playlists** from it to their own library.
- Per-user data (watched, positions, notes, focus hours) always stays per user;
  only the playlist/video metadata is shared.
- Draft tables to add: `collections(id, owner_id, title, description, visibility, created_at)`,
  `collection_playlists(collection_id, playlist_id, position)`,
  `user_library(user_id, playlist_id, added_at, source_collection_id?)`.
- The five current playlists become the seed content of "Sami's collection".

New questions from this idea:
- **Q66.** Who can create collections: every user, or only you at first? **Default:** every user, private by default.
- **Q67.** Discovery: a browse/search page of public collections, "trending", follow a creator? Or link-sharing only for now? **Default:** link-sharing + a simple public browse list.
- **Q68.** If the owner edits a shared collection, do people who added it see changes (live link), or did they get a copy? **Default:** adding a collection copies its playlists into your library; a "follow" option stays live.
- **Q69.** Can a collection creator claim credit/see how many people use it (adds, hours focused on it)? **Default:** show "added by N people" only.
- **Q70.** Shared metadata staleness: when a playlist changes on YouTube, who triggers a refresh, and do we store the last-refreshed time? **Default:** anyone can hit refresh, rate-limited; weekly job for popular ones.

Open questions:
- **Q33.** Can users add *single videos* too, or only playlists?
- ~~**Q34.**~~ **Decided:** shared cache keyed by playlist id plus collections (see 6.1).
- **Q35.** Moderation: any YouTube link allowed, or any content restrictions/reporting?
- **Q36.** Should videos that cannot be embedded still be usable (open on YouTube in a new tab, which would break focus lock)? **Default:** show as unavailable.
- **Q37.** Max playlists per user / max videos per playlist? **Default:** 20 playlists, 500 videos.
- **Q38.** How often to refresh a playlist's contents (new videos added)? **Default:** manual "refresh" button + weekly background job.
- **Q39.** Can focus sessions be tied to non-YouTube study (PDF, coding, reading)? i.e. is the product "focus for anything, with YouTube as one source"? **This changes positioning, please answer.**

---

## 7. Phase 4 (MVP 2): presence detection with the camera

You said "OpenCV". On the web the practical equivalents run **in the browser,
locally**: MediaPipe Face Detection / Face Landmarker (WASM, via
`@mediapipe/tasks-vision`) or TensorFlow.js. Real OpenCV would need a
server (video upload, expensive and privacy-heavy) or opencv.js (heavy, less accurate for faces).

**Default:** MediaPipe in the browser, video never leaves the device, only
booleans/counters are reported ("present" ratio) to the server.

What to detect, increasing difficulty:
1. Face/person present in frame (basic).
2. Looking at the screen (head pose / gaze), phone usage, eyes closed (drowsy).
3. More than one person (cheating by proxy).

Behaviors: sample ~2-5 fps, require absence of N seconds before reacting;
on absence -> warn, pause, then fail per rules. Calibration screen (lighting,
camera position) and graceful fallback if the camera is denied/unavailable.

Concerns: camera permission UX, battery/CPU, low light, privacy trust (must
state clearly "nothing recorded or uploaded"), spoofing (a photo in front of the
camera; liveness detection is hard), accessibility (people who must look away, take notes by hand).

Open questions:
- **Q40.** Is presence mandatory for some modes only (e.g. "Verified focus" with bonus points) and optional elsewhere? **Default:** optional, bonus multiplier.
- **Q41.** Detect only "face present", or also "looking at screen"/phone/drowsiness in v1 of the feature? **Default:** face present only.
- **Q42.** How long absence before pause / fail? **Default:** warn 10 s, pause 30 s, fail 2 min cumulative.
- **Q43.** Browser-only models (private, free) vs server-side OpenCV (more control, privacy/cost problems)? **Default:** browser-only.
- **Q44.** Any screenshots/snapshots stored for dispute resolution, or strictly nothing stored? **Default:** nothing stored.
- **Q45.** Should handwritten-notes users be accommodated (looking down is OK)? **Default:** yes, only presence counts.

---

## 8. Phase 5: social and growth (parked, but design for it now)

Possible: friends, public leaderboards (daily/weekly), study rooms ("focus together",
shared timers, body-doubling), badges, shareable profile cards, group goals.

Open questions:
- **Q46.** Is social in the vision at all, or a solo-discipline tool? **Default:** leaderboard + friends later.
- **Q47.** Leaderboard scope: global, friends only, or per-community/college?
- **Q48.** Do you want "focus rooms" where people see each other (live presence)? This pairs naturally with the camera feature but adds realtime infrastructure.

---

## 9. UX / design questions

- **Q49.** Keep the "Signal Dark" look (black + yellow) for the focus screen? **Default:** yes.
- **Q50.** New navigation: Home (start focus) / Library (playlists) / Notes / Profile / Todos? What is the landing page after login?
- **Q51.** Product name & branding: stay "Sami Labs", or a new product name/domain? Logo?
- **Q52.** Focus-screen mood: ultra-minimal (just a timer), or study dashboard (video + notes + timer)? **Default:** study layout with a prominent timer, option for "timer only".
- **Q53.** Accessibility: reduced-motion option, screen-reader support for timer, high-contrast? **Default:** keep existing a11y patterns + add these.
- **Q54.** Languages (English only vs i18n)? **Default:** English only.

---

## 10. Engineering questions

- **Q55.** TypeScript migration now (the codebase is plain JS)? Recommended before the data model grows. **Default:** yes, incrementally, for new code.
- **Q56.** Add routing (React Router) for `/focus`, `/profile`, `/library`? **Default:** yes.
- **Q57.** Add tests: unit tests for timer/points logic (Vitest), Playwright e2e for the focus flow? **Default:** yes for timer, points and leave-rules logic at least.
- **Q58.** Analytics/error tracking (Plausible/PostHog, Sentry)? **Default:** yes, privacy-friendly, no camera data ever.
- **Q59.** CI (lint + build + tests on PR) and preview deploys on Vercel? **Default:** yes.
- **Q60.** Offline/PWA support (installable, timer keeps working)? **Default:** later.
- **Q61.** Will you build this alone, with others, or with me writing most of it? Affects how I split work into PR-sized milestones.
- **Q62.** Timeline target: when do you want Phase 1 usable, and Phase 2?
- **Q63.** Monetization (free forever, premium for stats/cheat-proofing/desktop lock)? Doesn't change MVP 1, but affects data model (plans, billing).

---

## 11. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Web can't truly lock | Users expect a hard lock | Set expectations; penalise and record leaves; offer desktop/extension later |
| Cheating on leaderboards | Destroys trust | Server-side validation, daily caps, presence multiplier |
| Webcam privacy | Backlash / legal | Local-only processing, clear copy, opt-in, no storage |
| YouTube ToS / quota / embed limits | Breaks playlists | Official Data API, caching, handle non-embeddable videos |
| Scope creep | Never ships | Strict phase gates; Phase 1 shippable alone |
| Existing users' local data | Lost on account migration | One-time import flow, keep key formats stable |

## 12. Proposed milestones for Phase 1 (once Q1-Q18 are answered)

1. Timer engine (pure logic + tests): timestamp-based, pause/resume, session states.
2. Focus screen UI + route; setup form; countdown.
3. Fullscreen + keyboard lock + leave detection + grace/strike rules.
4. Embed the player and notepad inside the focus layout.
5. Local session log + "today" stats + summary screen.
6. Polish: sound, notifications, accessibility, responsive/degraded modes, docs update in `context/`.
