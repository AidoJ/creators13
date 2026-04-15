import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, ArrowRight, Users, GraduationCap } from "lucide-react";
import landscapeLeaf from "@/assets/landscape-leaf.png";
import landscapeWater from "@/assets/landscape-water.png";
import goldRing from "@/assets/gold-ring.png";
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

type SignupPath = "paying" | "case_study" | null;

export default function PlanSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Pre-fill from URL params (e.g. invite links)
  const urlTier = searchParams.get("tier") as TierKey | null;
  const urlCaseStudy = searchParams.get("case_study") === "true";
  const urlPractitionerCode = searchParams.get("practitioner_code") || "";

  // Determine initial path from URL
  const initialPath: SignupPath = urlCaseStudy ? "case_study" : null;

  const [signupPath, setSignupPath] = useState<SignupPath>(initialPath);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(urlCaseStudy ? "wren" : urlTier);
  const [annual, setAnnual] = useState(searchParams.get("billing") === "annual");
  const [practitionerCode, setPractitionerCode] = useState(urlPractitionerCode);
  const [practitionerName, setPractitionerName] = useState<string | null>(null);
  const [lookingUpCode, setLookingUpCode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const caseStudyRef = useRef<HTMLDivElement>(null);

  const isCaseStudy = signupPath === "case_study";

  // Force sign-out when arriving via case study invite link
  useEffect(() => {
    if (!user || signingOut || !urlCaseStudy) return;
    setSigningOut(true);
    supabase.auth.signOut().then(() => setSigningOut(false));
  }, [user, urlCaseStudy, signingOut]);

  // Auto-select wren when switching to case study
  useEffect(() => {
    if (signupPath === "case_study") {
      setSelectedTier("wren");
      setTimeout(() => {
        caseStudyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [signupPath]);

  // Look up practitioner name when code changes
  useEffect(() => {
    const code = practitionerCode.trim();
    if (!code) {
      setPractitionerName(null);
      return;
    }
    setLookingUpCode(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .rpc("lookup_practitioner_by_code", { _code: code });
      const row = data?.[0];
      if (row) {
        setPractitionerName(`${row.first_name || ""} ${row.last_name || ""}`.trim() || null);
      } else {
        setPractitionerName(null);
      }
      setLookingUpCode(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [practitionerCode]);

  const handleContinue = async () => {
    if (!selectedTier || !signupPath) return;
    if (isCaseStudy && !practitionerCode.trim()) return;

    const params = new URLSearchParams({
      tier: selectedTier,
      billing: annual ? "annual" : "monthly",
    });
    if (isCaseStudy) {
      params.set("case_study", "true");
      params.set("practitioner_code", practitionerCode.trim());
    }

    // If already logged in, check if this is an upgrade
    if (user) {
      const [{ data: profile }, { data: photos }] = await Promise.all([
        supabase.from("profiles").select("first_name, date_of_birth").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiling_photos").select("id").eq("user_id", user.id).limit(1),
      ]);

      const hasDetails = !!(profile?.first_name && profile?.date_of_birth);
      const hasPhotos = (photos?.length || 0) > 0;

      if (hasDetails && hasPhotos) {
        params.set("upgrade", "true");
      }

      if (selectedTier === "wren") {
        if (isCaseStudy) {
          navigate(`/enroll/details?${params.toString()}`);
        } else {
          navigate(`/enroll/practitioner?${params.toString()}`);
        }
      } else {
        navigate(`/enroll/payment?${params.toString()}`);
      }
    } else {
      navigate(`/enroll/signup?${params.toString()}`);
    }
  };

  const canContinue = signupPath && selectedTier && (!isCaseStudy || (practitionerCode.trim() && practitionerName));

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={0} />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {urlCaseStudy ? "Your Case Study Invitation" : "How Are You Joining?"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {urlCaseStudy
              ? "You've been invited to participate as a case study. Review your plan below and continue."
              : "Select how you'd like to begin your Creator Types journey."}
          </p>
        </div>

        {/* ── Path Selector ── */}
        {!urlCaseStudy && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            <button
              onClick={() => setSignupPath("case_study")}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 overflow-hidden",
                signupPath === "case_study"
                  ? "border-primary ring-2 ring-primary/30 shadow-lg"
                  : "border-border hover:border-primary/40 hover:shadow-md"
              )}
            >
              <img src={landscapeLeaf} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-card/60" />
              <div className="relative w-20 h-20 flex items-center justify-center">
                <img src={goldRing} alt="" className="absolute inset-0 w-full h-full object-contain" />
                <GraduationCap className="h-8 w-8" style={{ color: "#c5992a" }} />
              </div>
              <div className="relative">
                <h3 className="text-base font-display font-bold text-foreground mb-1">Case Study Volunteer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A practitioner or trainee has invited you to be profiled as part of their training. <strong>Free.</strong>
                </p>
              </div>
              {signupPath === "case_study" && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>

            <button
              onClick={() => setSignupPath("paying")}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 overflow-hidden",
                signupPath === "paying"
                  ? "border-primary ring-2 ring-primary/30 shadow-lg"
                  : "border-border hover:border-primary/40 hover:shadow-md"
              )}
            >
              <img src={landscapeWater} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-card/60" />
              <div className={cn(
                "relative w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                signupPath === "paying" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Users className="h-7 w-7" />
              </div>
              <div className="relative">
                <h3 className="text-base font-display font-bold text-foreground mb-1">Paying Client</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  I'd like to discover my Creator Types with a certified practitioner. Choose a plan below.
                </p>
              </div>
              {signupPath === "paying" && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          </div>
        )}

        {/* ── Case Study: practitioner code input ── */}
        {isCaseStudy && (
          <div ref={caseStudyRef} className="max-w-md mx-auto mb-10">
            <div className="bg-primary/5 border-2 border-primary rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <img src={birdWren} alt="Wren" className="h-10 w-auto" />
                <div>
                  <h3 className="text-sm font-display font-bold text-foreground">Wren — Free</h3>
                  <p className="text-xs text-muted-foreground">Case study participation</p>
                </div>
              </div>
              <div>
                <Label htmlFor="practitioner-code" className="text-xs font-semibold text-foreground">
                  Your Practitioner's ID Code
                </Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  This was provided by the practitioner who invited you.
                </p>
                <Input
                  id="practitioner-code"
                  value={practitionerCode}
                  onChange={(e) => setPractitionerCode(e.target.value)}
                  placeholder="e.g. AN001"
                  className="font-mono"
                  readOnly={!!urlPractitionerCode}
                />
                {lookingUpCode && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">Looking up practitioner…</p>
                )}
                {!lookingUpCode && practitionerName && (
                  <div className="flex items-center gap-1.5 mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                    <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <span className="text-xs font-semibold text-green-700">
                      {practitionerName}
                    </span>
                  </div>
                )}
                {!lookingUpCode && practitionerCode.trim() && !practitionerName && (
                  <p className="text-[11px] text-destructive mt-1.5">No practitioner found with this code.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Paying Client: tier selection ── */}
        {signupPath === "paying" && (
          <>
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

            {/* Tier cards — exclude free Wren for paying clients */}
            <div className="grid gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              {(Object.entries(TIERS) as [TierKey, typeof TIERS[TierKey]][])
                .filter(([key]) => key !== "wren")
                .map(([key, tier]) => {
                const isSelected = selectedTier === key;
                const price = annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice;

                const tierBg: Record<string, string> = {
                  robin: "bg-gradient-to-b from-pink-100/60 via-pink-50/40 to-white",
                  falcon: "bg-gradient-to-b from-blue-100/40 via-pink-50/30 to-white",
                  owl: "bg-gradient-to-b from-purple-100/40 via-pink-50/20 to-white",
                };

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTier(key)}
                    className={cn(
                      "relative flex flex-col rounded-2xl overflow-hidden border text-left transition-all duration-200 hover:shadow-lg focus:outline-none",
                      tierBg[key] || "bg-card",
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
                    {key === "owl" && (
                      <span className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        For Certified Practitioners
                      </span>
                    )}

                    <div className="flex items-center justify-center p-6 pb-2">
                      <img src={birdImages[key]} alt={tier.name} className="h-28 w-auto object-contain" />
                    </div>

                    <div className="p-5 pt-2 flex flex-col flex-1">
                      <h3 className="text-lg font-display font-bold text-foreground">{tier.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{tier.subtitle}</p>

                      <div className="mb-4">
                        <span className="text-2xl font-display font-bold text-foreground">${price}</span>
                        <span className="text-muted-foreground text-sm ml-1">/mo</span>
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
          </>
        )}

        {/* Continue button — only show once a path is selected */}
        {signupPath && (
          <div className="text-center space-y-3">
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="lg"
              className="rounded-full px-10 text-base font-semibold"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!user && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Already have an account?</p>
                <a
                  href={`/auth?returnTo=${encodeURIComponent("/enroll/plan")}`}
                  className="inline-flex items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-2.5 text-sm font-semibold transition-colors"
                >
                  Sign in
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
