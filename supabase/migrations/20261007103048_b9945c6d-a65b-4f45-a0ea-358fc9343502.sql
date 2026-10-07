
CREATE TABLE public.migration_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.migration_settings TO authenticated;
GRANT ALL ON public.migration_settings TO service_role;
ALTER TABLE public.migration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read migration settings" ON public.migration_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert migration settings" ON public.migration_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update migration settings" ON public.migration_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.migration_settings_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _required text[] := ARRAY['cut_off_date','retention_period','non_responder_period','non_responder_text','backup_days','privacy_phone','privacy_email','privacy_link','link_base_url','hosting_statement','hosting_region_text','email_provider_name','ai_disclosure_text'];
  _missing text[];
  _link text;
BEGIN
  NEW.updated_at := now();
  IF NEW.key = 'email_mode' AND NEW.value NOT IN ('off','test','live') THEN
    RAISE EXCEPTION 'email_mode must be off, test or live';
  END IF;
  IF NEW.key = 'enabled' AND NEW.value NOT IN ('true','false') THEN
    RAISE EXCEPTION 'enabled must be true or false';
  END IF;
  IF NEW.key = 'enabled' AND NEW.value = 'true' THEN
    SELECT array_agg(r) INTO _missing FROM unnest(_required) r
    WHERE NOT EXISTS (SELECT 1 FROM migration_settings s WHERE s.key = r AND btrim(s.value) <> '');
    IF _missing IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot enable: required settings are empty: %', array_to_string(_missing, ', ');
    END IF;
    SELECT value INTO _link FROM migration_settings WHERE key = 'link_base_url';
    IF _link !~* '^https://' OR _link ~* 'lovable\.app' THEN
      RAISE EXCEPTION 'Cannot enable: link_base_url must be an https address on your own connected domain';
    END IF;
  END IF;
  -- A required setting may not be emptied while the feature is enabled
  IF NEW.key = ANY(_required) AND btrim(NEW.value) = ''
     AND EXISTS (SELECT 1 FROM migration_settings WHERE key = 'enabled' AND value = 'true') THEN
    RAISE EXCEPTION 'Switch the feature off before clearing a required setting';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_migration_settings_guard BEFORE INSERT OR UPDATE ON public.migration_settings
FOR EACH ROW EXECUTE FUNCTION public.migration_settings_guard();

CREATE TABLE public.migration_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  phone_country text,
  practitioner_id uuid,
  practitioner_name text,
  needs_admin boolean NOT NULL DEFAULT false,
  needs_admin_reason text,
  protect_account boolean NOT NULL DEFAULT false,
  admin_cleared_at timestamptz,
  admin_cleared_by uuid,
  admin_cleared_note text,
  guardian_first_name text,
  guardian_last_name text,
  guardian_phone text,
  guardian_email text,
  health_info boolean,
  health_check boolean NOT NULL DEFAULT false,
  is_test boolean NOT NULL DEFAULT false,
  code text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  revoked_at timestamptz,
  choice smallint CHECK (choice IN (1,2,3)),
  option3_consent boolean,
  typed_name text,
  name_mismatch boolean NOT NULL DEFAULT false,
  responder_type text CHECK (responder_type IN ('subject','guardian')),
  answered_at timestamptz,
  answered_by text CHECK (answered_by IN ('self','admin')),
  wording_shown jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'not_answered' CHECK (status IN ('not_answered','answered','confirmed','actioned')),
  contact_status text NOT NULL DEFAULT 'not_sent' CHECK (contact_status IN ('not_sent','sent','opened','bounced','do_not_contact')),
  invite_sent_at timestamptz,
  last_reminder_at timestamptz,
  emails_sent integer NOT NULL DEFAULT 0,
  texted_by uuid,
  texted_at timestamptz,
  link_opened_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT migration_choice_code_len CHECK (length(code) >= 32),
  CONSTRAINT migration_choice_option3 CHECK (choice IS DISTINCT FROM 3 OR option3_consent = true),
  CONSTRAINT migration_choice_clear_note CHECK (admin_cleared_at IS NULL OR btrim(coalesce(admin_cleared_note,'')) <> '')
);
CREATE UNIQUE INDEX migration_choices_user_unique ON public.migration_choices(user_id) WHERE user_id IS NOT NULL AND is_test = false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.migration_choices TO authenticated;
GRANT ALL ON public.migration_choices TO service_role;
ALTER TABLE public.migration_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read migration choices" ON public.migration_choices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert migration choices" ON public.migration_choices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update migration choices" ON public.migration_choices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete test migration choices" ON public.migration_choices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND is_test = true);
CREATE TRIGGER update_migration_choices_updated_at BEFORE UPDATE ON public.migration_choices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.migration_attempts (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX migration_attempts_bucket_idx ON public.migration_attempts(bucket, created_at);
GRANT ALL ON public.migration_attempts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.migration_attempts_id_seq TO service_role;
ALTER TABLE public.migration_attempts ENABLE ROW LEVEL SECURITY;
