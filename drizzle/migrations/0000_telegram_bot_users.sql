CREATE TABLE public.tg_users (
  telegram_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  username text,
  tg_first_name text,
  full_name text,
  region text,
  district text,
  role text,
  goal text,
  step text NOT NULL DEFAULT 'full_name',
  registered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tg_users TO service_role;
ALTER TABLE public.tg_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tg_processed_updates (
  update_id bigint PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tg_processed_updates TO service_role;
ALTER TABLE public.tg_processed_updates ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tg_users_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER tg_users_touch BEFORE UPDATE ON public.tg_users
FOR EACH ROW EXECUTE FUNCTION public.tg_users_touch();