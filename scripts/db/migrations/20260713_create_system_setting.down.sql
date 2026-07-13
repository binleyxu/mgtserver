BEGIN;

DROP INDEX IF EXISTS public.idx_system_setting_singleton;
DROP TABLE IF EXISTS public.system_setting;

COMMIT;
