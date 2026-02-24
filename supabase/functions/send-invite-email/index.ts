import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteEmailRequest {
  to: string;
  clientName: string;
  inviteLink: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(apiKey);
    const { to, clientName, inviteLink }: InviteEmailRequest = await req.json();

    if (!to || !clientName || !inviteLink) {
      throw new Error("Missing required fields: to, clientName, inviteLink");
    }

    const { data, error } = await resend.emails.send({
      from: "13 Creators <noreply@connect.13creators.com>",
      to: [to],
      subject: "You're Invited to Join 13 Creators as a Case Study",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5C4033,#8B6914);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);">Creator Types Case Study</p>
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;">Greetings Beautiful Body!</h1>
            </td>
          </tr>

          <!-- Video thumbnail -->
          <tr>
            <td style="background-color:#f5f0eb;padding:24px 32px;text-align:center;">
              <a href="https://www.youtube.com/watch?v=N_hAuOoWFjM" target="_blank" style="display:inline-block;">
                <img src="https://img.youtube.com/vi/N_hAuOoWFjM/hqdefault.jpg" alt="Watch: 12 Creator Types In 12 Minutes" width="480" style="max-width:100%;border-radius:12px;border:2px solid #d4c5a9;" />
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:#888;font-style:italic;">Watch: 12 Creator Types In 12 Minutes</p>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;font-size:15px;line-height:1.7;color:#333333;">
              <p style="margin:0 0 16px;">Hi ${clientName},</p>

              <p style="margin:0 0 16px;">
                Thank you for your interest in volunteering as a case study for the
                <a href="http://sacredbusiness.com.au/wp-content/uploads/2026/02/2026-13CREATORS-Training-Prospectus.pdf" target="_blank" style="color:#8B6914;font-weight:600;text-decoration:underline;">13CREATORS Practitioner Training</a>.
              </p>

              <!-- Photos callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background-color:#faf6ef;border:1px solid #e8dcc8;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#333;">
                      📸 To become a case study, you'll be invited to share
                      <a href="https://sacredbusiness.com.au/creator-constitution-instructions/" target="_blank" style="color:#8B6914;font-weight:700;text-decoration:underline;">8 photos of your full body</a>
                      wearing swimwear or yoga gear.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;">
                In exchange, you will learn about two of your Creator Types, according to your body shape, facial features, hands and feet. Your Creator Types blueprint will give you a deeper awareness of your natural abilities, challenges and the purpose of your particular physical constitution, both individually and in groups.
              </p>

              <p style="margin:0 0 24px;">
                In other words, <strong>what purpose are you naturally built for?</strong>
              </p>

              <!-- Privacy -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:#f0ebe4;border:1px solid #d4c5a9;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#5C4033;">
                      🔒 Your photos will only be shared within class for teaching purposes and viewed only by students and the teacher and inventor of the Creator Types, A'Hara.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#8B6914,#5C4033);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:50px;">
                      Accept Your Personal Invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- More info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background-color:#faf8f5;border:1px solid #e8e2d8;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-weight:600;">For more information</p>
                    <p style="margin:0 0 6px;font-size:14px;">
                      📖 <a href="https://sacredbusiness.com.au/not-creators-made-equal/" target="_blank" style="color:#8B6914;text-decoration:underline;">Not All Creators Were Made Equal</a>
                    </p>
                    <p style="margin:0 0 6px;font-size:14px;">
                      📋 <a href="https://sacredbusiness.com.au/wp-content/uploads/2025/03/Creator-Types-FAQs-2025.pdf" target="_blank" style="color:#8B6914;text-decoration:underline;">Creator Types FAQs</a>
                    </p>
                    <p style="margin:0;font-size:14px;">
                      📘 <a href="http://sacredbusiness.com.au/wp-content/uploads/2026/02/2026-13CREATORS-Training-Prospectus.pdf" target="_blank" style="color:#8B6914;text-decoration:underline;">13CREATORS Training Prospectus</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#5C4033;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#d4c5a9;">Be Curious & Have Fun Learning About Your Body!</p>
              <a href="https://www.creatortypes.com" target="_blank" style="font-size:12px;color:rgba(255,255,255,0.6);text-decoration:underline;">www.creatortypes.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("send-invite-email error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
