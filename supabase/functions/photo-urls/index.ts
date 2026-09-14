import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKET = "profiling-photos";
const EXPIRES_IN = 60; // seconds — deliberately short-lived

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

    let body: { paths?: unknown; width?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const rawPaths = Array.isArray(body.paths) ? body.paths : null;
    if (!rawPaths) return json({ error: "paths must be an array of strings" }, 400);
    const paths = [
      ...new Set(
        rawPaths
          .filter((p): p is string => typeof p === "string" && p.length > 0 && !p.includes(".."))
          .slice(0, 100),
      ),
    ];
    if (paths.length === 0) return json({ urls: {} });

    const width =
      typeof body.width === "number" && body.width >= 32 && body.width <= 2000
        ? Math.round(body.width)
        : null;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller's elevated roles
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
    const isStaff = roles.includes("trainer") || roles.includes("admin");

    // Clients this caller is the active practitioner for
    const { data: linkRows } = await admin
      .from("client_practitioner")
      .select("client_id")
      .eq("practitioner_id", caller.id)
      .eq("active", true);
    const myClients = new Set((linkRows ?? []).map((r: { client_id: string }) => r.client_id));

    // Resolve case-study attachment folders to their owning ids
    const caseStudyIds = [
      ...new Set(
        paths
          .filter((p) => p.startsWith("case-study-attachments/"))
          .map((p) => p.split("/")[1])
          .filter(Boolean),
      ),
    ];
    const caseStudyOwners = new Map<string, string[]>();
    if (caseStudyIds.length > 0) {
      const { data: csRows } = await admin
        .from("case_studies")
        .select("id, practitioner_id, subject_user_id")
        .in("id", caseStudyIds);
      for (const cs of csRows ?? []) {
        caseStudyOwners.set(
          cs.id,
          [cs.practitioner_id, cs.subject_user_id].filter(Boolean) as string[],
        );
      }
    }

    const canAccess = (path: string): boolean => {
      if (isStaff) return true;
      const seg = path.split("/");
      const prefix = seg[0];

      if (prefix === "case-study-attachments") {
        const owners = caseStudyOwners.get(seg[1]) ?? [];
        return owners.some((id) => id === caller.id || myClients.has(id));
      }

      // reports/<subjectId>/..., session-images/<clientId>/..., body-drawings/<practitionerId>/...
      if (prefix === "reports" || prefix === "session-images" || prefix === "body-drawings") {
        const subject = seg[1];
        if (!subject) return false;
        return subject === caller.id || myClients.has(subject);
      }

      // <userId>/<photo>
      return prefix === caller.id || myClients.has(prefix);
    };

    const allowed = paths.filter(canAccess);
    const denied = paths.filter((p) => !allowed.includes(p));

    const urls: Record<string, string> = {};
    if (allowed.length > 0) {
      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrls(allowed, EXPIRES_IN, width ? { transform: { width, quality: 60 } } : undefined);
      if (error) return json({ error: error.message }, 500);
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
      }
    }

    return json({ urls, denied, expiresIn: EXPIRES_IN });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
