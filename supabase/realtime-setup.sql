-- ============================================================
-- KisanMart — Enable Supabase Realtime
-- Run ONCE in Supabase SQL Editor.
--
-- Adds the tables the app subscribes to (via <RealtimeRefresh />) to the
-- `supabase_realtime` publication. After this, ANY change to these tables —
-- even a direct SQL edit — is pushed live to every open admin/storefront page,
-- which then re-fetches automatically (no manual reload needed).
--
-- Safe to re-run: skips tables already in the publication.
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['products', 'categories', 'orders'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Verify (should list products, categories, orders):
--   select tablename from pg_publication_tables
--   where pubname = 'supabase_realtime' and schemaname = 'public'
--   order by tablename;
