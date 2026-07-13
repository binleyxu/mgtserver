BEGIN;

CREATE TABLE IF NOT EXISTS public.system_setting (
  id BIGSERIAL PRIMARY KEY,
  site_title VARCHAR(64) NOT NULL DEFAULT '管理端',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by BIGINT NULL REFERENCES public.admin(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_setting_singleton
  ON public.system_setting ((1));

INSERT INTO public.system_setting (site_title, maintenance_mode, updated_at, updated_by)
SELECT '管理端', FALSE, NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM public.system_setting);

COMMIT;
