-- Perf: evaluate auth.role() once per query (initplan) instead of per row.
-- Identical semantics. Fixes advisor 0003_auth_rls_initplan. (Audit 2026-06-01, finding 4.6.)
ALTER POLICY knowledge_chunks_read ON public.knowledge_chunks
  USING ((select auth.role()) = 'authenticated');
