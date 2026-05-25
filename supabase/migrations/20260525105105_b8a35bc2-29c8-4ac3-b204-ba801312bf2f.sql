
-- Table for practitioner-uploaded session images for a client (separate from body photos)
CREATE TABLE public.client_session_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  storage_path text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_session_images_client ON public.client_session_images(client_id);

ALTER TABLE public.client_session_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own session images"
  ON public.client_session_images FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Practitioners can view own uploads"
  ON public.client_session_images FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Assigned practitioners can view client session images"
  ON public.client_session_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.client_practitioner cp
    WHERE cp.client_id = client_session_images.client_id
      AND cp.practitioner_id = auth.uid()
      AND cp.active = true
  ));

CREATE POLICY "Practitioners can insert own session images"
  ON public.client_session_images FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own session images"
  ON public.client_session_images FOR DELETE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Trainers and admins can manage all session images"
  ON public.client_session_images FOR ALL
  USING (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for session-images/{client_id}/... prefix in profiling-photos bucket
CREATE POLICY "Practitioners can upload client session images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiling-photos'
    AND (storage.foldername(name))[1] = 'session-images'
    AND (
      has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (
        (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'trainee'::app_role))
        AND EXISTS (
          SELECT 1 FROM public.client_practitioner cp
          WHERE cp.practitioner_id = auth.uid()
            AND cp.active = true
            AND cp.client_id::text = (storage.foldername(name))[2]
        )
      )
    )
  );

CREATE POLICY "Practitioners and clients can view client session images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profiling-photos'
    AND (storage.foldername(name))[1] = 'session-images'
    AND (
      has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid()::text = (storage.foldername(name))[2]
      OR EXISTS (
        SELECT 1 FROM public.client_practitioner cp
        WHERE cp.practitioner_id = auth.uid()
          AND cp.active = true
          AND cp.client_id::text = (storage.foldername(name))[2]
      )
    )
  );

CREATE POLICY "Practitioners can delete client session images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profiling-photos'
    AND (storage.foldername(name))[1] = 'session-images'
    AND (
      has_role(auth.uid(), 'trainer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.client_practitioner cp
        WHERE cp.practitioner_id = auth.uid()
          AND cp.active = true
          AND cp.client_id::text = (storage.foldername(name))[2]
      )
    )
  );
