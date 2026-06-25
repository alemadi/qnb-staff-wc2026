-- ============================================================================
-- REOPEN CHAMPION PICKS — until Sun 28 June 2026, 10:00 PM Doha (k1 kickoff)
-- ----------------------------------------------------------------------------
-- The champion pick is gated server-side in save_picks() by the wc_locks row
-- '_champ'. While its ko time is in the past, save_picks() ignores any champion
-- sent from the browser (keeps the stored value). Moving that time forward
-- reopens the pick for EVERYONE (set or change) until the new lock.
--
-- This is the authoritative change. It MUST be paired with the client constant
-- CHAMP_LOCK in index.html (already set to 2026-06-28T19:00:00Z) so the UI shows
-- the picker as editable. Run this once in the Supabase SQL editor on the LIVE
-- project (the one index.html points at). wc_locks is not reachable via the REST
-- API by design, so it cannot be changed from the app.
-- ============================================================================

update public.wc_locks
   set ko = '2026-06-28T19:00:00Z'
 where id = '_champ';

-- Verify (expect one row, ko = 2026-06-28 19:00:00+00):
-- select id, ko from public.wc_locks where id = '_champ';
--
-- To re-close early, set ko back to now() or any past timestamp:
-- update public.wc_locks set ko = now() where id = '_champ';
