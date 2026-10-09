ALTER TABLE public.migration_choices ADD COLUMN IF NOT EXISTS choice_key text CHECK (choice_key IN ('keep_all','keep_account','delete_all'));
-- Backfill from the earlier numbering (1 = delete, 2 = keep account, 3 = keep everything)
UPDATE public.migration_choices SET choice_key = CASE choice WHEN 1 THEN 'delete_all' WHEN 2 THEN 'keep_account' WHEN 3 THEN 'keep_all' END WHERE choice IS NOT NULL AND choice_key IS NULL;
COMMENT ON COLUMN public.migration_choices.choice IS 'DEPRECATED: replaced by choice_key; numbers are display labels only';
COMMENT ON COLUMN public.migration_choices.option3_consent IS 'Consent tick for keep_all (name kept for compatibility)';

CREATE OR REPLACE FUNCTION public.migration_settings_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _required text[] := ARRAY['cut_off_date','retention_period','backup_days','privacy_phone','privacy_email','privacy_link','link_base_url','email_provider_name','ai_disclosure_text'];
  _live_required text[] := ARRAY['cut_off_date','privacy_phone','privacy_email','privacy_link','link_base_url'];
  _missing text[];
  _link text;
BEGIN
  NEW.updated_at := now();
  IF NEW.key = 'email_mode' AND NEW.value NOT IN ('off','test','live') THEN
    RAISE EXCEPTION 'email_mode must be off, test or live';
  END IF;
  IF NEW.key = 'email_mode' AND NEW.value = 'live' THEN
    SELECT array_agg(r) INTO _missing FROM unnest(_live_required) r
    WHERE NOT EXISTS (SELECT 1 FROM migration_settings s WHERE s.key = r AND btrim(s.value) <> '');
    IF _missing IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot switch email to live: required settings are empty: %', array_to_string(_missing, ', ');
    END IF;
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
  IF (NEW.key = ANY(_required) AND btrim(NEW.value) = ''
     AND EXISTS (SELECT 1 FROM migration_settings WHERE key = 'enabled' AND value = 'true'))
   OR (NEW.key = ANY(_live_required) AND btrim(NEW.value) = ''
     AND EXISTS (SELECT 1 FROM migration_settings WHERE key = 'email_mode' AND value = 'live')) THEN
    RAISE EXCEPTION 'Switch the feature off (and email out of live) before clearing a required setting';
  END IF;
  RETURN NEW;
END $function$;