import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_EDGE = 2400;
const JPEG_QUALITY = 82;

async function compressJpeg(bin: Uint8Array): Promise<Uint8Array> {
  try {
    const img = await Image.decode(bin);
    const longest = Math.max(img.width, img.height);
    if (longest > MAX_EDGE) {
      const scale = MAX_EDGE / longest;
      img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
    }
    const out = await img.encodeJPEG(JPEG_QUALITY);
    // Only use compressed version if it actually reduced size
    return out.byteLength < bin.byteLength ? out : bin;
  } catch (e) {
    console.warn("compressJpeg failed, uploading original:", (e as Error).message);
    return bin;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { user_id, photo_type, base64, content_type, ext } = await req.json();
    let bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const originalSize = bin.byteLength;

    // Auto-compress JPEG/PNG inputs to keep storage + render fast
    const ct = (content_type || "image/jpeg").toLowerCase();
    if (ct.includes("jpeg") || ct.includes("jpg") || ct.includes("png")) {
      bin = await compressJpeg(bin);
    }

    const path = `${user_id}/${photo_type}.${ext || "jpg"}`;
    const { error: upErr } = await sb.storage.from("profiling-photos").upload(path, bin, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throw upErr;
    const { error: dbErr } = await sb.from("profiling_photos").upsert(
      { user_id, photo_type, storage_path: path },
      { onConflict: "user_id,photo_type" }
    );
    if (dbErr) throw dbErr;
    return new Response(
      JSON.stringify({ ok: true, path, original_size: originalSize, stored_size: bin.byteLength }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
