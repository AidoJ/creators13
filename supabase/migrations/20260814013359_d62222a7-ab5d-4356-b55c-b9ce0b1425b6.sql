ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS certification_level smallint NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_certification_level_check CHECK (certification_level BETWEEN 1 AND 3);