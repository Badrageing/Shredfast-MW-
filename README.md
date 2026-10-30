# ShredFast · strength, endurance and core

Static GitHub Pages app, version 9. Open the existing homescreen app at the same URL.

## Eight-week hybrid block (version 9)

Two required full-body sessions plus one rotating circuit per week. An additional slot can record a third strength session (continue A/B alternating) OR an easy run. Actual date is editable. Optional sessions never inflate the 24-session required completion target. Partial/aborted sessions are retained but excluded from completed-session counts.

A: squat, floor press, RDL, row; lateral raise, curls, overhead triceps extension; dumbbell drag and reverse crunch. B: reverse lunge, row, RDL, push-ups; shoulder press, hammer curls, close-grip floor press; dumbbell drag and side plank. Main lifts: 2 work sets. For standard 30–40-minute sessions add 1–2 direct shoulder/arm sets and 2 sets of each core move. The 20-minute option keeps main lifts plus one core movement. Week 1 is an introduction; week 5 reduces intensity (3–4 reps in reserve, easier circuit). No completed sessions or weights are fabricated.

Circuit rotation (repeat after week 4): AMRAP15 Press Up; AMRAP20 Burpee; 150 Rep Challenge capped at 20 minutes; Time Cap 20 Min. Short versions record their actual time limit. AMRAP logs record full rounds and extra reps. Rep challenges record achieved repetitions and optional elapsed seconds. Compare the same type, load, time and counting convention only. These are existing workout selections with explicit time caps. Original exercise order is displayed. Core after circuits is optional.

Dumbbell drag records the weight of the single dumbbell and total alternating pulls (8 = 4 each side). Anti-rotation and stable pelvis are the execution goal. Bodyweight exercises do not require a load. Overhead triceps extension uses one dumbbell, so that field explicitly says one dumbbell. Other loaded lifts use kg per dumbbell (maximum 24 kg).

Only rows with actual reps/time are saved; prefilled/copied weights alone do not create sets. Completed strength sessions require at least 2 sets of each main lift; incomplete sessions can be saved as partial. Shoulder, arm and core work is recorded only when performed, never assumed. Forms show a previous logged set per exercise (different variants or technique may still limit comparison). Progress shows actual muscle involvement from recorded strength/core sets, including indirect involvement; this is not an effective-volume calculation or a completeness score for circuits.

Local drafts are saved while editing, scoped by account, block and slot. They restore after closing/reloading, but are NOT cloud records and are not counted as training. Explicit Save commits the entry to offline queue/cloud and removes its draft. A 90-second pause timer uses a deadline rather than assuming the app stays foregrounded. There is no service worker or cold offline launch support.

Version 8 hybrid entries, including the former strength-B exercise selection and fixed AMRAP15 logs, are accepted without relabeling or changing recorded exercises. Historical block2 remains separate.

## Tests

`node test-state.cjs` checks cloud queue, retries, archive and hybrid isolation, account changes, validation and legacy compatibility with mocked cloud transport.

`test-ui.cjs` uses `linkedom@0.18.12` as a test-only dependency for actual form DOM, draft restoration, weighted drag, partial saves, circuit metrics, optional selection, timer and account isolation. Install it separately and run `SHREDFAST_TEST_DOM=/absolute/path/to/linkedom node test-ui.cjs`. This is a DOM integration test, not a native iPhone visual or real-login test.

## Cloud setup for the user

1. Open **Daten & Cloud-Backup**. Export a backup before migration.
2. Sign in with your existing LifeOS app email and password (not the Supabase dashboard account). Select the previous block in the selector before migrating old logs.
3. Choose **Bisherige iPhone-Daten übernehmen** on the original iPhone homescreen app. Only missing sessions are added; existing cloud sessions are preserved. The hybrid block also offers explicit local-to-account import for training performed before sign-in.
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
