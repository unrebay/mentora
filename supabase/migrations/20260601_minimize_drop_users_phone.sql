-- Data minimization (152-ФЗ): phone was optional and never used functionally.
-- Removed all code references first (deployed in main 6122c2b), then dropped.
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
