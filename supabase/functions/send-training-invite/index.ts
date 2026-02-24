import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TrainingInviteRequest {
  callId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  zoomLink?: string;
  recurrenceRule?: string;
  practitionerUserIds?: string[];
  externalEmails?: string[];
}

function formatDateForTimezone(isoDate: string, timezone: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString("en-AU", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date(isoDate).toISOString();
  }
}

function generateICS(
  title: string,
  description: string,
  scheduledAt: string,
  durationMinutes: number,
  zoomLink?: string
): string {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatDT = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//13Creators//Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `DTSTART:${formatDT(start)}`,
    `DTEND:${formatDT(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description || "").replace(/\n/g, "\\n")}${zoomLink ? "\\n\\nZoom: " + zoomLink : ""}`,
    zoomLink ? `URL:${zoomLink}` : "",
    `UID:${crypto.randomUUID()}@13creators.com`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
}

function replaceTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase config missing");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(apiKey);

    const body: TrainingInviteRequest = await req.json();
    const {
      title,
      description,
      scheduledAt,
      durationMinutes,
      zoomLink,
      recurrenceRule,
      practitionerUserIds,
      externalEmails,
    } = body;

    if (!title || !scheduledAt) {
      throw new Error("Missing required fields: title, scheduledAt");
    }

    // Fetch email template from database
    const { data: template, error: tplError } = await supabase
      .from("email_templates")
      .select("subject, html_body")
      .eq("template_key", "training_call_invite")
      .single();

    if (tplError || !template) {
      console.error("Template fetch error:", tplError);
      throw new Error("Training call email template not found. Please create it in Admin → Emails.");
    }

    const icsContent = generateICS(title, description || "", scheduledAt, durationMinutes, zoomLink);
    const icsBase64 = btoa(icsContent);

    // Build reusable template fragments
    const descriptionHtml = description
      ? `<p style="color:#666;font-size:14px;margin:0 0 8px 0;">${description}</p>`
      : "";

    const recurrenceText =
      recurrenceRule && recurrenceRule !== "none"
        ? `<p style="color:#666;font-size:13px;margin:0 0 16px 0;">🔁 This is a <strong>${recurrenceRule}</strong> recurring call.</p>`
        : "";

    const zoomButton = zoomLink
      ? `<div style="text-align:center;margin:24px 0 0 0;"><a href="${zoomLink}" style="display:inline-block;background:#BB1B56;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Join Zoom Meeting →</a></div>`
      : "";

    let sentCount = 0;
    const errors: string[] = [];
    const inviteeRecords: Array<{ call_id: string; user_id: string | null; email: string; name: string | null }> = [];

    // Helper: send to one recipient
    async function sendToRecipient(
      email: string,
      firstName: string,
      timezone: string,
      userId: string | null
    ) {
      const localTime = formatDateForTimezone(scheduledAt, timezone);

      const vars: Record<string, string> = {
        firstName,
        title,
        description: descriptionHtml,
        localTime,
        durationMinutes: String(durationMinutes),
        timezone,
        recurrenceText,
        zoomButton,
        email,
      };

      const html = replaceTemplateVars(template.html_body, vars);
      const subject = replaceTemplateVars(template.subject, vars);

      // Track invitee
      if (body.callId) {
        inviteeRecords.push({ call_id: body.callId, user_id: userId, email, name: firstName !== "there" ? firstName : null });
      }

      try {
        const { error } = await resend.emails.send({
          from: "13 Creators <noreply@connect.13creators.com>",
          to: [email],
          subject,
          html,
          attachments: [
            { filename: "training-call.ics", content: icsBase64, content_type: "text/calendar" },
          ],
        });
        if (error) {
          console.error(`Error sending to ${email}:`, error);
          errors.push(email);
        } else {
          sentCount++;
        }
      } catch (e) {
        console.error(`Exception sending to ${email}:`, e);
        errors.push(email);
      }
    }

    // --- Send to selected practitioners ---
    if (practitionerUserIds && practitionerUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, timezone")
        .in("user_id", practitionerUserIds);

      for (const profile of profiles || []) {
        if (!profile.email) continue;
        await sendToRecipient(
          profile.email,
          profile.first_name || "Practitioner",
          profile.timezone || "Australia/Sydney",
          profile.user_id
        );
      }
    }

    // --- Send to external guest emails ---
    if (externalEmails && externalEmails.length > 0) {
      for (const guestEmail of externalEmails) {
        if (!guestEmail || !guestEmail.includes("@")) continue;
        await sendToRecipient(guestEmail, "there", "UTC", null);
      }
    }

    // --- Record invitees in DB ---
    if (inviteeRecords.length > 0) {
      const { error: insertErr } = await supabase
        .from("training_call_invitees")
        .insert(inviteeRecords);
      if (insertErr) console.error("Error recording invitees:", insertErr);
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: errors.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("send-training-invite error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
