-- Improve user list query performance for filtering/pagination endpoints.
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_register_source_idx
  ON public."user" (register_source);

CREATE INDEX CONCURRENTLY IF NOT EXISTS user_created_at_desc_idx
  ON public."user" (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS user_status_source_created_at_desc_idx
  ON public."user" (status, register_source, created_at DESC, id DESC);
