import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { client_user_id } = await req.json();
    if (!client_user_id) throw new Error("client_user_id is required");

    // Get client profile
    const { data: clientProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", client_user_id)
      .single();

    const clientName = [clientProfile?.first_name, clientProfile?.last_name].filter(Boolean).join(" ") || clientProfile?.email || "A client";

    // Find assigned practitioner(s)
    const { data: assignments } = await supabaseAdmin
      .from("client_practitioner")
      .select("practitioner_id")
      .eq("client_id", client_user_id)
      .eq("active", true);

    if (!assignments || assignments.length === 0) {
      // Also check case_studies where this user is the subject
      const { data: caseStudies } = await supabaseAdmin
        .from("case_studies")
        .select("practitioner_id")
        .eq("subject_user_id", client_user_id);

      if (!caseStudies || caseStudies.length === 0) {
        return new Response(JSON.stringify({ skipped: true, reason: "No practitioner found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use case study practitioners
      const practitionerIds = [...new Set(caseStudies.map(cs => cs.practitioner_id))];
      return await sendNotifications(supabaseAdmin, RESEND_API_KEY, practitionerIds, clientName, corsHeaders);
    }

    const practitionerIds = [...new Set(assignments.map(a => a.practitioner_id))];
    return await sendNotifications(supabaseAdmin, RESEND_API_KEY, practitionerIds, clientName, corsHeaders);

  } catch (e) {
    console.error("notify-practitioner-photos error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendNotifications(
  supabaseAdmin: any,
  resendApiKey: string,
  practitionerIds: string[],
  clientName: string,
  corsHeaders: Record<string, string>
) {
  // Load email template
  const { data: template } = await supabaseAdmin
    .from("email_templates")
    .select("subject, html_body")
    .eq("template_key", "photos_uploaded_notification")
    .single();

  const results: { practitioner_id: string; status: string; error?: string }[] = [];

  for (const practitionerId of practitionerIds) {
    try {
      // Get practitioner profile
      const { data: practProfile } = await supabaseAdmin
        .from("profiles")
        .select("email, first_name")
        .eq("user_id", practitionerId)
        .single();

      if (!practProfile?.email) {
        results.push({ practitioner_id: practitionerId, status: "skipped", error: "No email" });
        continue;
      }

      const practFirstName = practProfile.first_name || "Practitioner";
      const viewLink = "https://creators13.lovable.app/practitioner";

      let subject = template?.subject || "Your client {{clientName}} has uploaded their photos";
      let htmlBody = template?.html_body || getDefaultHtml();

      // Replace placeholders
      const replacements: Record<string, string> = {
        clientName,
        practitionerName: practFirstName,
        viewLink,
      };
      for (const [key, value] of Object.entries(replacements)) {
        const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        subject = subject.replace(re, value);
        htmlBody = htmlBody.replace(re, value);
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "13 Creators <noreply@connect.13creators.com>",
          to: [practProfile.email],
          subject,
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        results.push({ practitioner_id: practitionerId, status: "error", error: err });
      } else {
        results.push({ practitioner_id: practitionerId, status: "sent" });
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      results.push({ practitioner_id: practitionerId, status: "error", error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getDefaultHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;padding:32px;border:1px solid #e5e5e5;border-radius:12px;">
<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 16px 0;">New Photos Uploaded</h1>
<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px 0;">Hi {{practitionerName}},</p>
<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px 0;">Your client <strong>{{clientName}}</strong> has successfully uploaded their profiling photos. You can now view them in your practitioner dashboard.</p>
<div style="text-align:center;margin:24px 0;">
<a href="{{viewLink}}" style="display:inline-block;background:#BB1B56;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Photos →</a>
</div>
<p style="color:#999;font-size:12px;margin:24px 0 0 0;">— 13 Creators</p>
</div>
</body></html>`;
}
