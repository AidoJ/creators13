import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, Lock, Check } from "lucide-react";
import { TIERS, TierKey } from "@/lib/tiers";
import { useAuth } from "@/contexts/AuthContext";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import logo from "@/assets/13creators-logo.png";
import birdWren from "@/assets/bird-wren.png";
import birdRobin from "@/assets/bird-robin.png";
import birdFalcon from "@/assets/bird-falcon.png";
import birdOwl from "@/assets/bird-owl.png";

// TODO: Replace with your Stripe publishable key
const stripePromise = loadStripe("pk_test_REPLACE_ME");

const BIRD_IMAGES: Record<TierKey, string> = {
  wren: birdWren,
  robin: birdRobin,
  falcon: birdFalcon,
  owl: birdOwl,
};

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const tier = (params.get("tier") as TierKey) || "robin";
  const billing = params.get("billing") || "monthly";
  const canceled = params.get("canceled") === "true";
  const tierInfo = TIERS[tier] || TIERS.robin;
  const tierImage = BIRD_IMAGES[tier];

  const price = billing === "annual" ? tierInfo.annualPrice : tierInfo.monthlyPrice;

  const fetchClientSecret = useCallback(async () => {
    const priceId = tierInfo.stripe?.price_id;
    if (!priceId) throw new Error("No Stripe price configured for this tier.");

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        email: user?.email || "",
        user_id: user?.id || "",
        tier,
        billing,
        embedded: true,
        successUrl: `${window.location.origin}/enroll/details?tier=${tier}&billing=${billing}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      },
    });

    if (error || !data?.clientSecret) {
      console.error("Checkout error:", error, data);
      throw new Error(error?.message || "Could not create checkout session.");
    }

    return data.clientSecret;
  }, [tier, billing, user, tierInfo]);

  // Wren is free — redirect to details
  useEffect(() => {
    if (tier === "wren") {
      navigate("/enroll/details?tier=wren&billing=monthly", { replace: true });
    }
  }, [tier, navigate]);

  if (tier === "wren") return null;

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={2} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Order summary with branding */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="mb-6">
              <img src={logo} alt="13 Creators" className="h-10" />
            </div>

            {/* Tier card */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={tierImage}
                  alt={`${tierInfo.name} tier`}
                  className="h-36 w-36 object-contain mb-4"
                />
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {tierInfo.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">{tierInfo.subtitle}</p>

                <div className="mb-4">
                  <span className="text-4xl font-display font-bold text-foreground">
                    ${billing === "annual" ? Math.round(tierInfo.annualPrice / 12) : tierInfo.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground ml-1">/mo</span>
                  {billing === "annual" && tierInfo.annualPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${tierInfo.annualPrice} billed annually
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-border my-4" />

              <ul className="space-y-2">
                {tierInfo.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <hr className="border-border my-4" />

              <div className="flex justify-between text-sm font-bold">
                <span className="text-foreground">Total today</span>
                <span className="text-foreground">
                  A${price}
                  <span className="font-normal text-muted-foreground ml-1">
                    {billing === "annual" ? "/yr" : "/mo"}
                  </span>
                </span>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>Secured with 256-bit SSL encryption</span>
            </div>
          </div>

          {/* RIGHT: Embedded Stripe checkout */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Complete Payment
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your payment details below to activate your{" "}
              <span className="font-semibold text-foreground">{tierInfo.name}</span> membership.
            </p>

            {canceled && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Payment canceled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No charge was made. You can try again whenever you're ready.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-6 min-h-[400px]">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
