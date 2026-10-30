# ShredFast training log

Static GitHub Pages app. Open the existing homescreen app at the same URL.

## Cloud setup for the user

1. Open **Daten & Cloud-Backup**. Export a backup before migration.
2. Sign in with your existing Supabase/LifeOS email and password.
3. Choose **Bisherige iPhone-Daten übernehmen** on the original iPhone homescreen app. Only missing sessions are added; existing cloud sessions are preserved.
4. Wait for **Cloud gesichert · 30 Sessions** before closing.

Authentication is required; training data is never embedded in the public repository. The publishable key is intentionally public and cannot grant access to private rows. No service-role keys are used. Passwords are passed directly to Supabase Auth and are not stored by app code. Auth sessions persist separately from LifeOS.

## Storage and sync

`sf_v6_logs` remains the unsigned local store and migration source. Signed-in caches and durable pending changes are isolated per Supabase user in `sf_cloud_v1_<user-id>`. Signing out switches back to local-only data. Import is explicit and additive. JSON backups include the original raw local data as a recovery aid and must be treated as private.

Cloud changes are append-only events in `public.shredfast_events`, block ID `block2`. Event UUIDs make retries idempotent, including ambiguous network failures. Deletions are events, so a refresh cannot resurrect them. Latest server creation time (then event UUID) wins when multiple devices change a session. A stale offline edit uploaded later wins over an earlier cloud edit. Periodic, visibility and online events trigger synchronization. Offline editing requires the app to have already loaded; there is no service worker for cold offline launches.

RLS permits authenticated users to SELECT and INSERT only their own rows; anonymous access and UPDATE/DELETE are denied. The migration is recorded as `shredfast_private_training_sync` in the connected Supabase project. Existing LifeOS/networking tables were not changed. Event history retains previous values; the UI delete hides a session rather than erasing its history.

## Dependencies and verification

`supabase.min.js` is the vendored UMD bundle from `@supabase/supabase-js@2.57.4`, obtained from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js`. See `SUPABASE-LICENSE.txt`.

Run `node test-state.cjs` (no dependencies) for offline queue durability, migration isolation, retry, deletion, account separation, HTML escaping, invalid imports and storage failure behavior. The DOM is stubbed: this does not replace a real mobile browser test.

Database validation checked RLS and grants and verified rejection of cross-user inserts inside a rolled-back transaction. A real user sign-in and first device migration require the account owner. Tests do not use real credentials or training records.
