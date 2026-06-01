UPDATE public.case_studies
SET status = 'profiling_submitted', updated_at = now()
WHERE practitioner_id = (
  SELECT user_id FROM public.profiles
  WHERE first_name ILIKE 'Heidi' AND last_name ILIKE 'Orr' LIMIT 1
)
AND status = 'draft'
AND created_at < '2026-01-31';