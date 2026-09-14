import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedPhotoUrls } from "@/lib/signedUrls";

export interface ProfilingPhoto {
  photo_type: string;
  url: string;
}

const FACE_TYPES = ["face_front_smiling", "face_front_closed", "face_side"];
const BODY_TYPES = ["body_front", "body_side", "body_back"];

export function useProfilingPhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<ProfilingPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setPhotos([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiling_photos")
        .select("photo_type, storage_path")
        .eq("user_id", userId);
      const urls = await getSignedPhotoUrls((data ?? []).map((r) => r.storage_path));
      if (cancelled) return;
      setPhotos(
        (data ?? [])
          .filter((row) => urls[row.storage_path])
          .map((row) => ({ photo_type: row.photo_type, url: urls[row.storage_path] })),
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const facePhotos = photos.filter((p) => FACE_TYPES.includes(p.photo_type));
  const bodyPhotos = photos.filter((p) => BODY_TYPES.includes(p.photo_type));

  return { photos, facePhotos, bodyPhotos, loading };
}
