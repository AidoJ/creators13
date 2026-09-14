import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profiling-photos";

// In-app signed URLs live for 1 hour. They are generated on view, never stored.
const EXPIRES_IN = 3600;

export async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, EXPIRES_IN);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getSignedPhotoUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, EXPIRES_IN);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

// Signed URL with a server-side resize transform, for thumbnails.
export async function getSignedPhotoThumbUrl(
  path: string,
  width = 300
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, EXPIRES_IN, {
      transform: { width, quality: 60 },
    });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
