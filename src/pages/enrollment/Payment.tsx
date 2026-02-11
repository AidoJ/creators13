import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { TIERS, TierKey } from "@/lib/tiers";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const tier = (params.get("tier") as TierKey) || "robin";
  const billing = params.get("billing") || "monthly";
  const canceled = params.get("canceled") === "true";
  const uid = params.get("uid") || "";
  const userEmail = params.get("email") || "";
  const tierInfo = TIERS[tier] || TIERS.robin;

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
        email: userEmail,
        user_id: uid,
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

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={2} />

      <main className="container mx-auto px-4 py-10 max-w-md">
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
