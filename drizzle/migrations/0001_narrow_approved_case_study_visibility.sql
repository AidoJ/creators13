CREATE OR REPLACE FUNCTION public.is_active_practitioner_of(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _client_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.client_practitioner cp
    WHERE cp.client_id = _client_id AND cp.practitioner_id = auth.uid() AND cp.active = true
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_practitioner_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_practitioner_of(uuid) TO authenticated, service_role;

DROP POLICY "Approved case studies visible to practitioners" ON public.case_studies;
CREATE POLICY "Approved case studies visible to linked practitioners" ON public.case_studies
  FOR SELECT TO authenticated
  USING (status = 'approved' AND public.has_role(auth.uid(), 'practitioner') AND public.is_active_practitioner_of(subject_user_id));