import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { TIERS, TierKey } from "@/lib/tiers";
import { useAuth } from "@/contexts/AuthContext";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import logo from "@/assets/13creators-logo.png";
import birdWren from "@/assets/bird-wren.png";
import birdRobin from "@/assets/bird-robin.png";
import birdFalcon from "@/assets/bird-falcon.png";
import birdOwl from "@/assets/bird-owl.png";


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

  const price = billing === "annual"
    ? tierInfo.annualPrice
    : tierInfo.monthlyPrice;

  const [loading, setLoading] = useState(false);

  // Wren is free — redirect to details
  if (tier === "wren") {
    navigate("/enroll/details?tier=wren&billing=monthly", { replace: true });
    return null;
  }

  const handleCheckout = async () => {
    setLoading(true);

    const priceId = tierInfo.stripe?.price_id;
    if (!priceId) {
      toast({ title: "Configuration error", description: "No Stripe price configured for this tier.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        email: user?.email || "",
        user_id: user?.id || "",
        tier,
        billing,
        successUrl: `${window.location.origin}/enroll/details?tier=${tier}&billing=${billing}&payment=success`,
        cancelUrl: `${window.location.origin}/enroll/payment?tier=${tier}&billing=${billing}&canceled=true`,
      },
    });

    if (error || !data?.url) {
      console.error("Checkout error:", error, data);
      toast({ title: "Checkout failed", description: error?.message || "Could not create checkout session.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Open Stripe Checkout in a new tab (iframe blocks cross-origin redirects)
    window.open(data.url, "_blank");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={2} />

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="13 Creators" className="h-12" />
        </div>

        {/* Tier card display */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Tier image */}
            <div className="flex-shrink-0">
              <img
                src={tierImage}
                alt={`${tierInfo.name} tier`}
                className="h-40 w-40 object-cover"
              />
            </div>

            {/* Tier info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-display font-bold text-foreground mb-1">
                {tierInfo.name}
              </h2>
              <p className="text-muted-foreground mb-3">
                {tierInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Complete Payment
          </h1>
          <p className="text-muted-foreground">
            Activating your <span className="font-semibold text-foreground">{tierInfo.name}</span> membership
          </p>
        </div>

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

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Order Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tierInfo.name} — {tierInfo.subtitle}</span>
              <span className="font-semibold text-foreground">
                ${billing === "annual" ? tierInfo.annualPrice : tierInfo.monthlyPrice}
                <span className="text-muted-foreground font-normal">
                  /{billing === "annual" ? "yr" : "mo"}
                </span>
              </span>
            </div>

            {billing === "annual" && (
              <p className="text-xs text-muted-foreground">
                Billed annually at ${tierInfo.annualPrice}/year (${Math.round(tierInfo.annualPrice / 12)}/mo)
              </p>
            )}

            <hr className="border-border" />

            <div className="flex justify-between text-sm font-bold">
              <span className="text-foreground">Total today</span>
              <span className="text-foreground">
                ${price}
                <span className="font-normal text-muted-foreground ml-1">
                  AUD
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-2">Accepted payment methods</h3>
          <p className="text-xs text-muted-foreground">
            Credit/debit card • BECS Direct Debit • Bank transfer • PayID
          </p>
        </div>

        <div className="text-center">
          <Button
            onClick={handleCheckout}
            disabled={loading}
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with Stripe
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
