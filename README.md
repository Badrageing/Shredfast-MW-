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

## v11 — Quick logging and progression dashboard

Standard prescription: 3 sets for the four main lifts, 2 for shoulders, arms and core. Short sessions retain the existing two-main-set completion rule so old entries remain valid. With a 20-minute budget use the short variant; the complete standard volume may exceed 40 minutes including rests.

Latest weight is a suggestion only; repetition fields remain blank until entered or explicitly copied. Copy buttons never copy RIR. RIR remains optional and can be expanded. Filled repetition rows are still the source of truth, not visual checkmarks.

The dashboard reports selected plan-week completed strength/circuit sessions and actual core sets. Exercise trends compare the two latest dated strength exposures only if the set count matches the prescription and each exposure uses one consistent load. A load increase is reported separately from repetition progress. No hypertrophy or estimated 1RM claims are inferred.

Progression suggestion: twice reach the upper rep target at the same load on different dates using the full prescribed set count. The latest last set needs >=1 RIR, with no recorded zero-RIR sets; otherwise the UI asks the user to check reserve/technique. Recommend the smallest available increment, capped at 24 kg, rather than inventing the dumbbell increment. Core/bodyweight exercises receive rep/time guidance. Deload week 5 does not prompt an increase in the workout form.

### Apple Watch follow-up (not connected)

The current browser app does not read HealthKit. A native iOS companion or wrapper with a native HealthKit module, signing and an iPhone build is required. Ask for granular read authorization only for selected data types. A first integration could read workouts, sleep and resting heart rate; missing samples must remain unknown, never become zero. Deduplicate by HealthKit sample UUID, preserve timestamps/timezones, and handle revoked access. Keep raw health data on-device by default; cloud upload requires a separate deliberate data decision.

Recovery suggestions should compare personal multi-day baselines, expose evidence and let the user override. Never increase weights based on watch calories, sleep or heart rate alone. Strength progression continues to depend on logged load, reps, set count, technique and reserve. Real HealthKit authorization and background synchronization need native-device tests; none is implemented or claimed in v11.

Primary Apple reference: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data

## v12 — Minimal tracking interface

Two primary tabs: Training and Dashboard. Training shows four weekly slots and direct Start/Open actions. Dashboard shows selected-week strength/circuit completions, actual core sets, compact per-exercise progression statuses, and expandable history. Settings, archive selection and workout library sit below the main content.

Workout exercises expand individually; their headers show entered set counts and prescribed targets. Weight, reps and set/pause confirmation remain available, with compact repeat-set buttons. Metadata, technique, reserve and notes are secondary disclosures. Invalid form fields reveal their containing disclosures before browser focus. Persistence, archive records and progression rules are unchanged.

Validation: state/sync regression suite and DOM workflow suite including two-tab navigation, compact weekly list, draft restore, saving, exercise history and progression edge cases. Real iPhone visual/interaction validation is still outstanding.

## v13 — Calendar-independent training

The main screen starts A, B, one of the four configured ShredFast circuits or an easy run on any date. Each new session uses a UUID-based `F-` key; repeated A/B sessions and multiple sessions on one day have separate identities. Old W1–W8 slots remain readable and editable, and the original 30-session archive stays separate. Free sessions share the existing hybrid cache and append-only private cloud stream. The hybrid import limit is now 10,000 entries rather than 32 slots. Clients should reload to v13 before syncing free sessions; pre-v13 clients cannot understand their keys.

The dashboard counts the last seven local calendar dates, excluding future dates, while all-time history and exercise progression continue to use the full record. Recommendations alternate from the latest completed strength session. New records preserve an initial recordedAt timestamp as a same-date ordering tiebreaker. Starting an unfinished workout resumes its per-account local draft; an explicit discard action removes that draft. Saving clears it. Drafts are local, not cloud-synced.

Circuit instructions show ordered exercises, counts and format before result entry. Strength exercises show their prescribed sets and rep range; dates stay visible. Four circuits are the agreed rotation; the older workout library remains accessible under settings.

Validation: storage/sync regressions plus >32 free entries, repeated same-day A, draft continuation, edits, deletion/tombstones, retry deduplication, and all four circuit forms. The hosted database constraint was checked on a temporary rollback-only test table with two free keys, one legacy key and an invalid-key rejection. Production user rows were not modified by testing.

## v14 — Full catalog and transparent daily recommendation

All 27 source workouts in the existing WORKOUTS library are selectable from the main training screen. The four rotation workouts retain their existing IDs, avoiding split histories. Other library items use stable library-* IDs and preserve the original exercise strings. AMRAP records rounds, the ladder records completed steps (0–10), and For Time records elapsed seconds when completed, or actual partial work when stopped. For Time without a defined original cap has an explicitly user-selected 1–40 minute budget; it is not presented as an original protocol cap. The UI groups the catalog under a searchable disclosure rather than adding 27 primary cards.

A voluntary daily form entry (unknown/fit/tired/rest) is stored only in a per-account, same-day browser key. It is not uploaded with training logs. Stale or malformed entries become unknown. This is a self-report, not a recovery score or measured Apple Health status. There is no HealthKit connection in this release.

The recommendation uses visible heuristic rules: a tired/rest self-report suggests light activity/rest; a recorded loaded session today/yesterday suggests a lighter day; otherwise the next completed A/B alternation is suggested, with existing exercise progression advice. After two strength sessions and no circuit in the last seven days, suggest a short previously used circuit (or Press Up baseline) for comparability. After at least three strength days plus a circuit, suggest a lighter day. Future dates are excluded. These are cautious scheduling choices, not validated physiological thresholds. Weak performance across multiple main lifts prompts holding the load, not diagnosing poor recovery. The user can select any workout regardless of the recommendation.

The live form suppresses positive load prompts when today's self-report is tired/rest. It never increases entered weights automatically. Equal-date sessions do not qualify as two progression exposures. Circuit comparisons require matching workout, load and duration on different dates; partial entries are excluded. HealthKit integration remains the native iPhone follow-up described above; no fabricated sensor values are used.

Validation: all 27 workouts opened and saved through DOM forms, then reloaded; legacy storage/sync regression suite; AMRAP/reps/time/ladder results; repeated free sessions; recommendation A/B sequencing, recent-session gate, circuit slot, low form, stale form and future-date exclusion. Real iPhone/HealthKit validation remains outstanding.

References for the boundaries: Apple HealthKit authorization https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data ; readiness construct and limitations https://pubmed.ncbi.nlm.nih.gov/42926133/ . These sources do not validate this app's scheduling thresholds.
