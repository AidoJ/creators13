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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STEPS = ["Plan", "Signup", "Payment", "Photos", "Booking"] as const;

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
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    heightCm: "",
    shoeSize: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
    medicalHistory: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    // 1. Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
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

    // 2. Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      email: form.email,
      first_name: form.firstName,
      last_name: form.lastName,
      display_name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone,
      date_of_birth: form.dateOfBirth || null,
      gender: form.gender || null,
      height_cm: form.heightCm ? Number(form.heightCm) : null,
      shoe_size: form.shoeSize || null,
      address_line1: form.addressLine1 || null,
      address_line2: form.addressLine2 || null,
      city: form.city || null,
      state: form.state || null,
      postal_code: form.postalCode || null,
      country: form.country || null,
      medical_history: form.medicalHistory || null,
      enrollment_step: "signed_up" as const,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      toast({ title: "Profile creation failed", description: profileError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 3. Create subscription record (free tier or pending for paid)
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      tier: tier as any,
      status: tier === "wren" ? "active" : "incomplete",
      billing_period: billing,
    });

    if (subError) {
      console.error("Subscription creation error:", subError);
    }

    // 4. If case study, assign practitioner relationship
    if (caseStudy && practitionerCode) {
      // Store practitioner code — the practitioner validation happens server-side later
      console.log("Case study enrollment with practitioner code:", practitionerCode);
    }

    // 5. Navigate to next step
    if (tier === "wren") {
      // Free tier — skip payment, go to photos
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate("/enroll/photos");
    } else {
      // Paid tier — go to payment
      toast({ title: "Account created!", description: "Please check your email to verify, then complete payment." });
      const payParams = new URLSearchParams({ tier, billing });
      navigate(`/enroll/payment?${payParams.toString()}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <a href="/" className="flex items-center gap-3">
            <img src={logo} alt="13 Creators" className="h-10" />
          </a>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-1">
                {i > 0 && <span className="mx-1">→</span>}
                {i === 1 ? (
                  <>
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-foreground font-medium">{step}</span>
                  </>
                ) : (
                  <span className={i < 1 ? "text-primary" : ""}>{step}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">
            Setting up your <span className="font-semibold text-foreground">{tierInfo.name}</span> membership
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Account section */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Account</h2>
            <div className="grid sm:grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" />
                </div>
              </div>
            </div>
          </section>

          {/* Personal details */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Personal Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" required value={form.firstName} onChange={set("firstName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" required value={form.lastName} onChange={set("lastName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+61 4XX XXX XXX" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Physical details */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Physical Details</h2>
            <p className="text-xs text-muted-foreground">Used for Creator Type profiling. You can update these later.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input id="heightCm" type="number" min={50} max={250} value={form.heightCm} onChange={set("heightCm")} placeholder="e.g. 170" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shoeSize">Shoe Size (AU)</Label>
                <Input id="shoeSize" value={form.shoeSize} onChange={set("shoeSize")} placeholder="e.g. 10" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Address</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="addressLine1">Street Address</Label>
                <Input id="addressLine1" value={form.addressLine1} onChange={set("addressLine1")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addressLine2">Apt / Unit</Label>
                <Input id="addressLine2" value={form.addressLine2} onChange={set("addressLine2")} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={set("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={set("state")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input id="postalCode" value={form.postalCode} onChange={set("postalCode")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={set("country")} />
              </div>
            </div>
          </section>

          {/* Medical */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Medical History</h2>
            <p className="text-xs text-muted-foreground">Optional. Relevant conditions that may affect body profiling (e.g. scoliosis, injuries).</p>
            <div className="space-y-1.5">
              <Textarea
                id="medicalHistory"
                value={form.medicalHistory}
                onChange={set("medicalHistory")}
                placeholder="Any relevant medical history..."
                rows={3}
              />
            </div>
          </section>

          <div className="text-center pb-8">
            <Button type="submit" size="lg" className="rounded-full px-10 text-base font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {tier === "wren" ? "Create Account" : "Continue to Payment"} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
