-- Rollback avatar columns from public.admin (PostgreSQL)

DROP INDEX IF EXISTS idx_admin_avatar_version;

ALTER TABLE public.admin
  DROP COLUMN IF EXISTS avatar_updated_at,
  DROP COLUMN IF EXISTS avatar_version,
  DROP COLUMN IF EXISTS avatar_large_url,
  DROP COLUMN IF EXISTS avatar_small_url;
