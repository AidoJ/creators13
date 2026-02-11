import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import { TIERS, TierKey } from "@/lib/tiers";
import logo from "@/assets/13creators-logo.png";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";

// Role mapping based on tier
const TIER_ROLES: Record<TierKey, string> = {
  wren: "client",
  robin: "client",
  falcon: "client",
  owl: "trainee",
};

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const tier = (params.get("tier") as TierKey) || "wren";
  const billing = params.get("billing") || "monthly";
  const caseStudy = params.get("case_study") === "true";
  const practitionerCode = params.get("practitioner_code") || "";
  const tierInfo = TIERS[tier] || TIERS.wren;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    // 1. Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError) {
      toast({ title: "Signup failed", description: authError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      toast({ title: "Signup failed", description: "No user ID returned", variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2. Create minimal profile (details added later in Step 4)
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      email,
      enrollment_step: "signed_up" as const,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      toast({ title: "Profile creation failed", description: profileError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 3. Auto-assign role based on tier
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: TIER_ROLES[tier] as any,
    });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    // 4. Create subscription record
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      tier: tier as any,
      status: tier === "wren" ? "active" : "incomplete",
      billing_period: billing,
    });

    if (subError) {
      console.error("Subscription creation error:", subError);
    }

    // 5. If case study, log the practitioner code (linking happens server-side)
    if (caseStudy && practitionerCode) {
      console.log("Case study enrollment with practitioner code:", practitionerCode);
      // TODO: Link client to practitioner via client_practitioner table once practitioner lookup is built
    }

    toast({
      title: "Account created!",
      description: "Please check your email to verify your account.",
    });

    // 6. Navigate to next step
    const nextParams = new URLSearchParams({ tier, billing });
    if (tier === "wren") {
      // Free tier skips payment → go to personal details + photos
      navigate(`/enroll/details?${nextParams.toString()}`);
    } else {
      // Paid tier → go to payment
      navigate(`/enroll/payment?${nextParams.toString()}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={1} />

      <main className="container mx-auto px-4 py-10 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">
            Setting up your <span className="font-semibold text-foreground">{tierInfo.name}</span> membership
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </section>

          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-10 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {tier === "wren" ? "Create Account" : "Continue to Payment"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
