# Smart Bookmark App
https://kunal112137-bookmark-manager-c2ws.vercel.app/login

This is a small Next.js (App Router) application that demonstrates Google OAuth sign-in with Supabase, per-user bookmarks, and realtime updates across open tabs.

## Features
- Google sign-in (OAuth) via Supabase Auth
- Add / delete bookmarks (title + URL)
- Bookmarks private per user (RLS)
- Realtime updates using Supabase Realtime

## Local development

1. Create a Supabase project at https://app.supabase.com
2. In the SQL editor, run the `supabase.sql` file included in this repo to create the `bookmarks` table and policies.
3. Enable Google OAuth in Supabase: go to Authentication → Providers → Google and provide client ID/secret from Google Cloud Console. Add allowed redirect URL(s): `http://localhost:3000` and your deployed domain.
4. Copy the project URL and anon key and set them in your environment (local `.env` or Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with Google.

## Deployment to Vercel

- Create a new Vercel project and connect this GitHub repo.
- In Vercel project settings, add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.
- Set Google OAuth redirect URL in Supabase to include your Vercel domain (e.g. `https://your-app.vercel.app`).

## Notes / implementation details

- The client-side Supabase helper is at `src/lib/supabaseClient.ts`.
- Auth state is managed in `src/components/AuthProvider.tsx` which listens to `supabase.auth.onAuthStateChange`.
- The main UI is in `src/components/BookmarkList.tsx`. It loads the current user's bookmarks and subscribes to `INSERT` and `DELETE` events via `supabase.channel(...).on('postgres_changes', ...)` so multiple tabs update in realtime.
- RLS policies are required so that each user ongit add .
ly sees and manages their own rows. The `supabase.sql` file contains the SQL to create the table and policies.
## Troubles I ran into and how I solved them

Below are concrete problems I hit while building this app and the steps I took to fix them. These notes include the debugging actions, configuration changes, and small code edits that resolved each issue.

- **Redirect URL mismatches (Google OAuth)**: Google OAuth failed with a redirect error during sign-in.
	- Root cause: The OAuth redirect URL(s) configured in Supabase/Google Cloud did not exactly match the app's runtime origin.
	- How I diagnosed: I reproduced the sign-in flow locally and observed an OAuth error in the browser console and the network request responses from Google.
	- Fix: Add the exact origins to the Google provider and Supabase settings (e.g. `http://localhost:3000` for local dev and your deployed domain for production). Also ensure `NEXT_PUBLIC_SUPABASE_URL` matches the Supabase project URL in your environment.
	- Tip: When deploying (Vercel, Netlify), update the allowed redirect URL in both Google Cloud and Supabase to include the deployed domain.

- **Realtime updates not arriving across tabs**: The bookmark list didn't update in other open tabs after insert/delete.
	- Root cause: Realtime channels require the target table to have RLS policies that allow the authenticated user to see their rows; without proper policies the realtime messages were ignored or blocked.
	- How I diagnosed: Subscriptions appeared to connect, but no `postgres_changes` events appeared for other sessions. I verified the Supabase Realtime logs and tried queries with different auth states.
	- Fix: Update `supabase.sql` to create RLS policies for `SELECT`, `INSERT`, and `DELETE` scoped to `auth.uid()`. Example policy (SQL):

	```sql
	create policy "select_own" on bookmarks
		for select using (user_id = auth.uid());
	create policy "insert_own" on bookmarks
		for insert with check (user_id = auth.uid());
	create policy "delete_own" on bookmarks
		for delete using (user_id = auth.uid());
	```

	- Also ensure rows are inserted with the correct `user_id` (from `auth.session()` on the server or `supabase.auth.getUser()` on the client).

- **Auth state and App Router (client components)**: Auth state wasn't available where I expected in the app router layout.
	- Root cause: Next.js App Router treats server and client components differently; auth and realtime hooks must run inside client components.
	- How I diagnosed: The auth listener didn't run when placed in a server component and the UI showed unauthenticated state even when signed in.
	- Fix: Create `AuthProvider` as a client component (`"use client"`) and wrap it in `app/layout.tsx` so child client components can access auth state. Use `supabase.auth.onAuthStateChange` inside the provider and keep the logic client-side.

- **URL validation and user input edge cases**: Users could paste invalid URLs which caused bookmark creation or link navigation issues.
	- Fix: Add simple URL validation before inserting (e.g., require protocol, optionally prepend `https://` if missing) and sanitize input by trimming and limiting length.

If you want, I can add explicit examples of the RLS SQL in `supabase.sql`, include a small troubleshooting guide in `docs/`, or add runtime checks in code to surface helpful errors when OAuth or realtime subscriptions fail.

## Next steps / improvements

- Add editing of bookmarks and metadata
- Improve validation and sanitization of URLs
- Add pagination or search


