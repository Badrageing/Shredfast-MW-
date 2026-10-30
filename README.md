# ShredFast · strength, endurance and core

Static GitHub Pages app, version 8. Open the existing homescreen app at the same URL.

## Eight-week hybrid block

Monday: full-body A. Wednesday: full-body B. Friday: AMRAP15 Press Up plus core. Sunday: optional 20–30-minute easy jog/run-walk. Strength sessions have a short 20-minute option (2 sets of each lift, one core exercise with 2 sets) and a standard 30–40-minute option (3 sets per lift, both core exercises with 2 sets). Weeks 1 and 5 use 2 lifting sets; week 5 is an easier week. Standard circuit = 15 minutes; short = 12; week 5 easy 10–12. Circuit timing is recorded separately from total session duration. No start date or performed sessions are fabricated.

A: dumbbell squat + floor press; RDL + one-arm row; dead bug and side plank. B: reverse lunge + row; RDL + overhead press; reverse crunch and side plank. Alternate exercises within pairs with rest: 30–45 seconds to switch, 75–90 seconds after the pair, more when needed. Use controlled reps and generally 1–2 reps in reserve, about 3 in week 1 and 3–4 in week 5. Increase load by the smallest available step after completing the upper rep target across planned sets with good technique. Dumbbells are limited to 24 kg each. Unilateral reps and side-plank time are per side; record the weaker side.

The circuit uses the existing n-07 workout (10 press-ups, 10 deadlifts, 10 presses, 10 rows), with a new standardized count of 10 total unilateral rows (5 each side). Old round counts are comparable only if time, load and execution/counting match. Adjustable dumbbell swings and snatches are not prescribed. Optional runs are excluded from the 24-session completion target.

Training prescription is a starting plan, adjusted from actual performance and recovery. Core training builds abdominal strength; visible definition also depends on overall body fat and nutrition. Combining endurance and strength is supported by [Schumann et al., systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34757594/); the exact weekly split here reflects the user's 20–40-minute constraint.

## Cloud setup for the user

1. Open **Daten & Cloud-Backup**. Export a backup before migration.
2. Sign in with your existing LifeOS app email and password (not the Supabase dashboard account). Select the previous block in the selector before migrating old logs.
3. Choose **Bisherige iPhone-Daten übernehmen** on the original iPhone homescreen app. Only missing sessions are added; existing cloud sessions are preserved.
4. Wait for **Cloud gesichert · 30 Sessions** before closing.

Authentication is required; training data is never embedded in the public repository. The publishable key is intentionally public and cannot grant access to private rows. No service-role keys are used. Passwords are passed directly to Supabase Auth and are not stored by app code. Auth sessions persist separately from LifeOS.

## Storage and sync

`sf_v6_logs` remains the old unsigned local store and migration source. The hybrid block uses `sf_hybrid1_logs`. Signed-in caches and durable pending changes are isolated per Supabase user and block: archive `sf_cloud_v1_<user-id>`, hybrid `sf_cloud_v1_<user-id>_hybrid1`. Signing out switches back to local-only data. Import is explicit and additive. JSON backups include the original raw local data as a recovery aid and must be treated as private.

Cloud changes are append-only events in `public.shredfast_events`, block IDs `block2` (previous plan) and `hybrid1` (new plan). Event UUIDs make retries idempotent, including ambiguous network failures. Deletions are events, so a refresh cannot resurrect them. Latest server creation time (then event UUID) wins when multiple devices change a session. A stale offline edit uploaded later wins over an earlier cloud edit. Periodic, visibility and online events trigger synchronization. Offline editing requires the app to have already loaded; there is no service worker for cold offline launches.

RLS permits authenticated users to SELECT and INSERT only their own rows; anonymous access and UPDATE/DELETE are denied. Migrations are recorded as `shredfast_private_training_sync` and `shredfast_hybrid_training_block` in the connected Supabase project. Existing LifeOS/networking tables were not changed. Event history retains previous values; the UI delete hides a session rather than erasing its history.

## Dependencies and verification

`supabase.min.js` is the vendored UMD bundle from `@supabase/supabase-js@2.57.4`, obtained from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js`. See `SUPABASE-LICENSE.txt`.

Run `node test-state.cjs` (no dependencies) for offline queue durability, migration isolation, retry, deletion, account separation, HTML escaping, invalid imports, storage failure behavior, hybrid per-set validation, optional running, and offline block switching. Backups v1 from the old block remain importable with that block selected; version 2 includes its block identifier. Imports are additive and do not replace existing sessions. The DOM is stubbed: this does not replace a real mobile browser test.

Database validation checked RLS and grants and verified rejection of cross-user inserts inside a rolled-back transaction. A real user sign-in and first device migration require the account owner. Tests do not use real credentials or training records.
