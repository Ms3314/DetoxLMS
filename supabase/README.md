# Supabase setup (accounts, profile, synced hours)

Accounts use Supabase Auth with email + password. Passwords are hashed and stored by
Supabase; this app never sees or stores them.

1. Create a free project at https://supabase.com (name it anything, pick a region near you).
2. **SQL Editor** -> New query -> paste all of [`schema.sql`](schema.sql) -> Run.
3. **Authentication -> Providers -> Email**: keep Email enabled. For the simplest sign-up,
   turn **Confirm email** off. If you leave it on, new users must click a link in an email
   before they can sign in (the app shows a "check your email" message either way).
4. **Project Settings -> API**: copy the **Project URL** and the **anon public** key.
   (Never use the `service_role` key in this app.)
5. Locally, copy `.env.example` to `.env.local` and fill in both values, then restart `npm run dev`.
6. On Vercel, add the same two variables under Project Settings -> Environment Variables and redeploy.

Without these variables the app still works as a guest: the login page explains that accounts
are not configured, and sessions stay in this browser only.

## What is stored

| Table | Contents | Who can read/write |
| --- | --- | --- |
| `auth.users` | email + hashed password (managed by Supabase) | Supabase only |
| `profiles` | `username` (3-20 chars: a-z, 0-9, `_`) | You can read your own row |
| `focus_sessions` | one row per finished session, incl. counted hours | You can read and insert your own rows |

Row Level Security is on for both tables. Counted hours are computed in the browser, so they
can be faked by a technical user; that is acceptable for friends-first use and must be
validated server-side before any shared leaderboard.
