import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TIERS, TierKey } from "@/lib/tiers";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";

export default function Details() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const tier = (params.get("tier") as TierKey) || "wren";
  const billing = params.get("billing") || "monthly";
  const paymentStatus = params.get("payment");
  const tierInfo = TIERS[tier] || TIERS.wren;

  const isPaymentSuccess = paymentStatus === "success" || paymentStatus === "skipped";

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={3} />

      <main className="container mx-auto px-4 py-10 max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
          {isPaymentSuccess ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {tier === "wren" ? "Account Created!" : "Payment Successful!"}
              </h1>
              <p className="text-muted-foreground">
                Your <span className="font-semibold text-foreground">{tierInfo.name}</span> membership is now active.
              </p>
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-left space-y-2">
                <p className="font-medium text-foreground">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete your profile details</li>
                  <li>Upload your profiling photos</li>
                  <li>Book your consultation session</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  const nextParams = new URLSearchParams({ tier, billing });
                  navigate(`/enroll/photos?${nextParams.toString()}`);
                }}
                size="lg"
                className="rounded-full px-10 text-base font-semibold"
              >
                Upload Your Photos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Processing your enrollment...</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
