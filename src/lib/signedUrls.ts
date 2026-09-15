import { supabase } from "@/integrations/supabase/client";

/**
 * Signed URLs for the private `profiling-photos` bucket.
 *
 * URLs are minted server-side by the `photo-urls` edge function, which checks
 * that the caller owns the photo, is the assigned practitioner, or is a
 * trainer/admin. They expire after 60 seconds and are never stored anywhere.
 */

const EXPIRES_IN = 900; // seconds, matches the edge function
const CACHE_TTL = 720_000; // 12 min — refresh well before expiry

type CacheEntry = { url: string; at: number };
const cache = new Map<string, CacheEntry>();

const cacheKey = (path: string, width?: number) => `${width ?? "full"}::${path}`;

function readCache(path: string, width?: number): string | null {
  const hit = cache.get(cacheKey(path, width));
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.url;
  return null;
}

async function mint(paths: string[], width?: number): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const p of [...new Set(paths.filter(Boolean))]) {
    const cached = readCache(p, width);
    if (cached) result[p] = cached;
    else missing.push(p);
  }
  if (missing.length === 0) return result;

  // The edge function caps each request at 100 paths.
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100);
    const { data, error } = await supabase.functions.invoke("photo-urls", {
      body: width ? { paths: batch, width } : { paths: batch },
    });
    if (error || !data?.urls) continue;
    for (const [path, url] of Object.entries(data.urls as Record<string, string>)) {
      cache.set(cacheKey(path, width), { url, at: Date.now() });
      result[path] = url;
    }
  }
  return result;
}

export async function getSignedPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const map = await mint([path]);
  return map[path] ?? null;
}

/** Bypass the cache and mint a brand new URL (used when an image fails to load). */
export async function refreshSignedPhotoUrl(path: string, width?: number): Promise<string | null> {
  if (!path) return null;
  cache.delete(cacheKey(path, width));
  const map = await mint([path], width);
  return map[path] ?? null;
}

export async function getSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  return mint(paths);
}

/** Signed URL with a server-side resize transform, for thumbnails. */
export async function getSignedPhotoThumbUrl(path: string, width = 300): Promise<string | null> {
  if (!path) return null;
  const map = await mint([path], width);
  return map[path] ?? null;
}

export async function getSignedPhotoThumbUrls(
  paths: string[],
  width = 300,
): Promise<Record<string, string>> {
  return mint(paths, width);
}

/** Fetch the raw bytes of a photo as a data URL (for PDF embedding). */
export async function getPhotoDataUrl(path: string): Promise<string | null> {
  const url = await getSignedPhotoUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const SIGNED_URL_EXPIRES_IN = EXPIRES_IN;
