-- Applied through Supabase migration shredfast_free_training_sessions.
alter table public.shredfast_events drop constraint shredfast_events_session_key_check;
alter table public.shredfast_events add constraint shredfast_events_session_key_check check (
 (block_id='block2' and session_key ~ '^W([1-9]|10)-(Mo|Mi|Fr)$') or
 (block_id='hybrid1' and (session_key ~ '^W[1-8]-(Mo|Mi|Fr|So)$' or session_key ~ '^F-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'))
);
