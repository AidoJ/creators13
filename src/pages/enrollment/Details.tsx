import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { TIERS, TierKey } from "@/lib/tiers";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";

export default function Details() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const tier = (params.get("tier") as TierKey) || "wren";
  const billing = params.get("billing") || "monthly";
  const paymentStatus = params.get("payment");
  const tierInfo = TIERS[tier] || TIERS.wren;

  // Determine if user just arrived from payment/signup
  const isPaymentSuccess = paymentStatus === "success" || paymentStatus === "skipped";

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!isPaymentSuccess);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Australia");
  const [medicalHistory, setMedicalHistory] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: `${firstName} ${lastName}`.trim() || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        height_cm: heightCm ? Number(heightCm) : null,
        shoe_size: shoeSize || null,
        address_line1: addressLine1 || null,
        address_line2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        country: country || null,
        medical_history: medicalHistory || null,
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Failed to save details", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Details saved!" });
    const nextParams = new URLSearchParams({ tier, billing });
    navigate(`/enroll/photos?${nextParams.toString()}`);
  };

  // Show confirmation first if arriving from payment
  if (isPaymentSuccess && !showForm) {
    return (
      <div className="min-h-screen bg-background">
        <EnrollmentHeader currentStep={3} />
        <main className="container mx-auto px-4 py-10 max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {tier === "wren" ? "Account Created!" : "Payment Successful!"}
            </h1>
            <p className="text-muted-foreground">
              Your <span className="font-semibold text-foreground">{tierInfo.name}</span> membership is now active.
              Next, let's add your personal details.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="rounded-full px-10 text-base font-semibold"
            >
              Add My Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={3} />

      <main className="container mx-auto px-4 py-10 max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Your Personal Details</h1>
          <p className="text-muted-foreground">
            These details help us with your Creator Type profiling session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 400 000 000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Physical */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Physical Details</h2>
            <p className="text-xs text-muted-foreground -mt-2">Used for body-type profiling — all data is kept confidential.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input id="height" type="number" required min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shoe">Shoe Size (AU) *</Label>
                <Input id="shoe" required value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} placeholder="8" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Address</h2>
            <div className="space-y-1.5">
              <Label htmlFor="addr1">Street Address</Label>
              <Input id="addr1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr2">Apartment / Unit</Label>
              <Input id="addr2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Unit 4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sydney" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="NSW" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postal">Postal Code</Label>
                <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="2000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Medical */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Medical History</h2>
            <p className="text-xs text-muted-foreground -mt-2">Any conditions, surgeries, or injuries that may affect your body shape or posture.</p>
            <Textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Scoliosis, knee replacement, pregnancy..."
              rows={4}
            />
          </section>

          {/* Submit */}
          <div className="text-center pb-8">
            <Button type="submit" size="lg" className="rounded-full px-10 text-base font-semibold" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Save & Continue to Photos
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
