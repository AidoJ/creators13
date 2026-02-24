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
  practitionerUserIds?: string[];  // specific practitioners to invite (empty = all)
  externalEmails?: string[];        // guest emails outside the system
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

function buildEmailHtml(
  firstName: string,
  title: string,
  description: string | undefined,
  localTime: string,
  durationMinutes: number,
  tz: string,
  recurrenceRule: string | undefined,
  zoomLink: string | undefined
): string {
  const recurrenceText =
    recurrenceRule && recurrenceRule !== "none"
      ? `<p style="color:#666;font-size:14px;">This is a <strong>${recurrenceRule}</strong> recurring call.</p>`
      : "";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:40px 20px;">
      <div style="background:#007e8c;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;">📅 Training Call Scheduled</h1>
      </div>
      <p style="color:#333;font-size:16px;">Hi ${firstName},</p>
      <p style="color:#333;font-size:14px;">A new training call has been scheduled:</p>
      <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #007e8c;">
        <h2 style="color:#007e8c;font-size:18px;margin:0 0 8px 0;">${title}</h2>
        ${description ? `<p style="color:#666;font-size:14px;margin:0 0 8px 0;">${description}</p>` : ""}
        <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 4px 0;">🕐 ${localTime}</p>
        <p style="color:#666;font-size:13px;margin:0;">Duration: ${durationMinutes} minutes · Timezone: ${tz}</p>
      </div>
      ${recurrenceText}
      ${
        zoomLink
          ? `<div style="text-align:center;margin:24px 0;">
              <a href="${zoomLink}" style="display:inline-block;background:#007e8c;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Join Zoom Meeting →</a>
            </div>`
          : ""
      }
      <p style="color:#999;font-size:12px;text-align:center;margin-top:32px;">13 Creators · Training Program</p>
    </div>
  `;
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

    const icsContent = generateICS(title, description || "", scheduledAt, durationMinutes, zoomLink);
    const icsBase64 = btoa(icsContent);

    let sentCount = 0;
    const errors: string[] = [];

    // --- Send to selected practitioners ---
    const hasSelectedPractitioners = practitionerUserIds && practitionerUserIds.length > 0;

    if (hasSelectedPractitioners) {
      // Fetch profiles for selected practitioners only
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, timezone")
        .in("user_id", practitionerUserIds);

      for (const profile of (profiles || [])) {
        if (!profile.email) continue;

        const tz = profile.timezone || "Australia/Sydney";
        const localTime = formatDateForTimezone(scheduledAt, tz);
        const firstName = profile.first_name || "Practitioner";

        const html = buildEmailHtml(firstName, title, description, localTime, durationMinutes, tz, recurrenceRule, zoomLink);

        try {
          const { error } = await resend.emails.send({
            from: "13 Creators <noreply@connect.13creators.com>",
            to: [profile.email],
            subject: `Training Call: ${title}`,
            html,
            attachments: [{ filename: "training-call.ics", content: icsBase64, content_type: "text/calendar" }],
          });
          if (error) { console.error(`Error sending to ${profile.email}:`, error); errors.push(profile.email); }
          else { sentCount++; }
        } catch (e) { console.error(`Exception sending to ${profile.email}:`, e); errors.push(profile.email); }
      }
    }

    // --- Send to external guest emails ---
    if (externalEmails && externalEmails.length > 0) {
      const utcTime = formatDateForTimezone(scheduledAt, "UTC");

      for (const guestEmail of externalEmails) {
        if (!guestEmail || !guestEmail.includes("@")) continue;

        const html = buildEmailHtml("there", title, description, utcTime, durationMinutes, "UTC", recurrenceRule, zoomLink);

        try {
          const { error } = await resend.emails.send({
            from: "13 Creators <noreply@connect.13creators.com>",
            to: [guestEmail],
            subject: `Training Call Invite: ${title}`,
            html,
            attachments: [{ filename: "training-call.ics", content: icsBase64, content_type: "text/calendar" }],
          });
          if (error) { console.error(`Error sending to ${guestEmail}:`, error); errors.push(guestEmail); }
          else { sentCount++; }
        } catch (e) { console.error(`Exception sending to ${guestEmail}:`, e); errors.push(guestEmail); }
      }
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
