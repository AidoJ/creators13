// One-off admin tool: convert specified profiling_photos HEIC files to JPEG
// using Lovable AI Gateway is overkill — instead use a pure JS HEIC decoder.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import decode from "https://esm.sh/heic-decode@2.0.0";
// @ts-ignore - jpeg-js for encoding
import * as jpegJs from "https://esm.sh/jpeg-js@0.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find HEIC photos for this user. Optionally limit to one photo_type.
    const { photo_type } = await (async () => {
      try { const b = await req.clone().json(); return { photo_type: b.photo_type }; } catch { return { photo_type: null }; }
    })();

    let q = supabase
      .from("profiling_photos")
      .select("id, photo_type, storage_path")
      .eq("user_id", user_id)
      .ilike("storage_path", "%.HEIC");
    if (photo_type) q = q.eq("photo_type", photo_type);
    const { data: photos, error: queryErr } = await q;

    if (queryErr) throw queryErr;

    const results: any[] = [];

    for (const p of photos ?? []) {
      try {
        // Download HEIC
        const { data: blob, error: dlErr } = await supabase.storage
          .from("profiling-photos")
          .download(p.storage_path);
        if (dlErr) throw dlErr;

        const heicBuf = new Uint8Array(await blob.arrayBuffer());

        // Decode HEIC -> raw RGBA
        const decoded = await decode({ buffer: heicBuf });
        const { width, height, data } = decoded;

        // Encode as JPEG
        const jpeg = jpegJs.encode({ data: new Uint8Array(data), width, height }, 88);

        const newPath = p.storage_path.replace(/\.HEIC$/i, ".jpeg");

        // Upload JPEG
        const { error: upErr } = await supabase.storage
          .from("profiling-photos")
          .upload(newPath, jpeg.data, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (upErr) throw upErr;

        // Update DB row
        const { error: updErr } = await supabase
          .from("profiling_photos")
          .update({ storage_path: newPath })
          .eq("id", p.id);
        if (updErr) throw updErr;

        // Delete old HEIC
        await supabase.storage.from("profiling-photos").remove([p.storage_path]);

        results.push({ photo_type: p.photo_type, old: p.storage_path, new: newPath, status: "converted" });
      } catch (e) {
        results.push({ photo_type: p.photo_type, path: p.storage_path, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
