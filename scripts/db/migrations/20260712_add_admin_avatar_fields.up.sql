-- Add avatar columns to public.admin (PostgreSQL)
-- Safe to run once. If your migration tool supports transactions, run in one transaction.

ALTER TABLE public.admin
  ADD COLUMN IF NOT EXISTS avatar_small_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_large_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_version BIGINT,
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

-- Optional: default avatar backfill for existing rows (adjust path to your static mount)
UPDATE public.admin
SET
  avatar_small_url = COALESCE(avatar_small_url, '/static/avatar/default_32.jpg'),
  avatar_large_url = COALESCE(avatar_large_url, '/static/avatar/default_128.jpg'),
  avatar_version = COALESCE(avatar_version, 1),
  avatar_updated_at = COALESCE(avatar_updated_at, NOW())
WHERE avatar_small_url IS NULL
   OR avatar_large_url IS NULL
   OR avatar_version IS NULL
   OR avatar_updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_avatar_version ON public.admin (avatar_version);
