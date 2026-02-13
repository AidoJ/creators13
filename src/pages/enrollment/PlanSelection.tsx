import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TIERS, TierKey } from "@/lib/tiers";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import birdWren from "@/assets/bird-wren.png";
import birdRobin from "@/assets/bird-robin.png";
import birdFalcon from "@/assets/bird-falcon.png";
import birdOwl from "@/assets/bird-owl.png";

const birdImages: Record<TierKey, string> = {
  wren: birdWren,
  robin: birdRobin,
  falcon: birdFalcon,
  owl: birdOwl,
};

export default function PlanSelection() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [annual, setAnnual] = useState(false);
  const [isCaseStudy, setIsCaseStudy] = useState(false);
  const [practitionerCode, setPractitionerCode] = useState("");

  const handleContinue = () => {
    if (!selectedTier) return;
    if (selectedTier === "wren" && isCaseStudy && !practitionerCode.trim()) return;

    const params = new URLSearchParams({
      tier: selectedTier,
      billing: annual ? "annual" : "monthly",
    });
    if (selectedTier === "wren" && isCaseStudy) {
      params.set("case_study", "true");
      params.set("practitioner_code", practitionerCode.trim());
    }
    navigate(`/enroll/signup?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={0} />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Choose Your Level
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start your Creator Types journey. Pick the level that suits where you are right now.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                !annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual <span className="text-xs opacity-75 ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][]).map(([key, tier]) => {
            const isSelected = selectedTier === key;
            const price = annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedTier(key);
                  if (key !== "wren") setIsCaseStudy(false);
                }}
                className={cn(
                  "relative flex flex-col rounded-2xl overflow-hidden border bg-card text-left transition-all duration-200 hover:shadow-lg focus:outline-none",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-lg"
                    : "border-border hover:border-primary/40"
                )}
              >
                {key === "robin" && (
                  <span className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                )}

                {/* Bird image */}
                <div className="flex items-center justify-center p-6 pb-2">
                  <img
                    src={birdImages[key]}
                    alt={tier.name}
                    className="h-28 w-auto object-contain"
                  />
                </div>

                {/* Content */}
                <div className="p-5 pt-2 flex flex-col flex-1">
                  <h3 className="text-lg font-display font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{tier.subtitle}</p>

                  <div className="mb-4">
                    <span className="text-2xl font-display font-bold text-foreground">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && <span className="text-muted-foreground text-sm ml-1">/mo</span>}
                    {annual && tier.annualPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${tier.annualPrice} billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Selection indicator */}
                  <div className={cn(
                    "mt-4 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : key === "robin"
                        ? "border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground"
                        : "bg-primary/15 text-primary hover:bg-primary/25"
                  )}>
                    {isSelected ? "Selected ✓" : "Select"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Case Study toggle for Wren */}
        {selectedTier === "wren" && (
          <div className="max-w-md mx-auto bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 mb-8 shadow-md">
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-3">
              This only applies to Wren subscription
            </p>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="case-study"
                checked={isCaseStudy}
                onChange={(e) => setIsCaseStudy(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 accent-amber-600"
              />
              <div>
                <Label htmlFor="case-study" className="text-sm font-bold text-amber-900 cursor-pointer">
                  I'm joining as a Case Study
                </Label>
                <p className="text-xs text-amber-700 mt-1">
                  A Practitioner or Trainee has invited you to be profiled as part of their training.
                </p>
              </div>
            </div>
            {isCaseStudy && (
              <div className="mt-4 pl-7">
                <Label htmlFor="practitioner-code" className="text-xs font-medium text-foreground">
                  Practitioner ID Code
                </Label>
                <Input
                  id="practitioner-code"
                  value={practitionerCode}
                  onChange={(e) => setPractitionerCode(e.target.value)}
                  placeholder="Enter your practitioner's code"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}

        {/* Continue button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedTier || (selectedTier === "wren" && isCaseStudy && !practitionerCode.trim())}
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
