import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHOTO_REQUIREMENTS: Record<string, string> = {
  face_front_closed:
    "A front-facing photo of the person's face with mouth closed and a neutral expression. The entire face must be visible including forehead, ears, and jawline. No glasses, no makeup, hair tied back.",
  face_front_smiling:
    "A front-facing photo of the person's face smiling with teeth showing. The face should be mostly visible including forehead and jawline. No glasses, no makeup, hair tied back. The photo can be in portrait or landscape orientation — do not fail based on orientation alone.",
  face_side:
    "A clear side profile of the person's face. The ear, jawline, and nose profile should be clearly visible. No glasses, hair tied back behind the ear.",
  body_front:
    "A full body photo from head to toe, person facing the camera, standing naturally. Must be wearing tight-fitting clothing (swimwear/yoga wear). No shoes or socks. The entire body from head to feet must be visible.",
  body_back:
    "A full body photo from head to toe, person's back facing the camera, standing naturally. The spine should be visible. Must be wearing tight-fitting clothing. No shoes or socks. The entire body from head to feet must be visible.",
  body_side:
    "A full body photo from head to toe, side profile of the person standing naturally. Must be wearing tight-fitting clothing. No shoes or socks. The entire body from head to feet must be visible.",
  feet:
    "A top-down photo of both feet together, bare feet (no shoes or socks). Toes and arches should be clearly visible.",
  hands:
    "A photo of both hands shown palm-down (back of hands facing camera). Fingers should be spread slightly. Both hands visible.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photo_type, image_base64 } = await req.json();

    if (!photo_type || !image_base64) {
      return new Response(
        JSON.stringify({ error: "photo_type and image_base64 are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requirement = PHOTO_REQUIREMENTS[photo_type];
    if (!requirement) {
      return new Response(
        JSON.stringify({ error: "Unknown photo_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a photo quality reviewer for a body profiling service called 13 Creators. 
Your job is to check if a submitted photo meets specific requirements.

Be helpful and lenient. Only fail a photo if it is clearly wrong (e.g. completely wrong body part, extremely blurry, or completely cut off).
Do NOT fail a photo for:
- Photo orientation (portrait vs landscape) — either is fine
- Minor framing issues where the subject is still clearly visible
- Slight variations in expression or posture

Focus on these key checks:
1. Does the photo match the expected type (face/body/feet/hands)?
2. Is the subject reasonably visible and not severely cut off?
3. Are the major clothing/accessory guidelines mostly followed?
4. Is the photo clear enough for a practitioner to assess?

When in doubt, pass the photo. Respond using the tool provided.`;

    const userPrompt = `Review this photo. It should be: ${requirement}

Check if the photo meets these requirements and provide your assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "photo_review",
              description: "Submit the photo review result",
              parameters: {
                type: "object",
                properties: {
                  pass: {
                    type: "boolean",
                    description: "true if the photo meets the requirements well enough for profiling, false if it needs to be retaken",
                  },
                  feedback: {
                    type: "string",
                    description: "Brief feedback (1-2 sentences) explaining the result. If pass=true, confirm what looks good. If pass=false, explain what needs to change.",
                  },
                },
                required: ["pass", "feedback"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "photo_review" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI review unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: auto-pass if AI didn't use the tool
      return new Response(
        JSON.stringify({ pass: true, feedback: "Photo accepted." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
