import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Try to get user from JWT first, fall back to body params
    let userEmail: string | undefined;
    let userId: string | undefined;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) {
        userEmail = data.user.email;
        userId = data.user.id;
        logStep("User from JWT", { userId, email: userEmail });
      }
    }

    const body = await req.json();
    const { priceId, successUrl, cancelUrl, email, user_id } = body;

    // Fall back to body params if JWT auth didn't work (unconfirmed user)
    if (!userEmail && email) {
      userEmail = email;
      userId = user_id;
      logStep("User from body params", { userId, email: userEmail });
    }

    if (!userEmail) throw new Error("No user email available");
    if (!priceId) throw new Error("priceId is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl || `${origin}/enroll/details?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/enroll/payment?canceled=true`,
      payment_method_types: ["card"],
      metadata: {
        user_id: userId || "",
      },
    });

    // Also create role + subscription records server-side if user_id provided
    if (userId) {
      // Insert role (ignore if exists)
      await supabaseClient.from("user_roles").upsert(
        { user_id: userId, role: "client" },
        { onConflict: "user_id,role" }
      );

      // Insert subscription (ignore if exists)
      await supabaseClient.from("subscriptions").upsert(
        {
          user_id: userId,
          tier: body.tier || "robin",
          status: "incomplete",
          billing_period: body.billing || "monthly",
        },
        { onConflict: "user_id" }
      );
      logStep("Created role + subscription records");
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
