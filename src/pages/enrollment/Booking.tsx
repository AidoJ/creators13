import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TIERS, TierKey } from "@/lib/tiers";
import { Calendar, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const tier = (params.get("tier") as TierKey) || "wren";
  const tierInfo = TIERS[tier] || TIERS.wren;
  const [calendlyEventTime, setCalendlyEventTime] = useState<string | null>(null);
  const [calendlyZoomLink, setCalendlyZoomLink] = useState<string | null>(null);
  const [calendlyBooked, setCalendlyBooked] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");

  // Listen for Calendly postMessage events to capture scheduled time
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        console.log("[Booking] Calendly event_scheduled payload:", JSON.stringify(e.data?.payload));
        setCalendlyBooked(true);

        // Try direct start_time fields first
        const directTime =
          e.data?.payload?.event?.start_time ||
          e.data?.payload?.invitee?.start_time;
        
        if (directTime && directTime.includes("T")) {
          setCalendlyEventTime(directTime);
        }

        // Capture join/meeting URL if available
        const meetingUrl =
          e.data?.payload?.event?.location?.join_url ||
          e.data?.payload?.event?.join_url ||
          e.data?.payload?.invitee?.meeting_url;
        if (meetingUrl) {
          setCalendlyZoomLink(meetingUrl);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      const returnTo = encodeURIComponent(`/enroll/booking?tier=${tier}`);
      navigate(`/auth?returnTo=${returnTo}`, { replace: true });
    }
  }, [loading, user, tier, navigate]);

  // Load Calendly widget script dynamically
  useEffect(() => {
    const existing = document.querySelector('script[src*="calendly.com"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={7} />

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Schedule Your Profiling Session
          </h1>
          <p className="text-muted-foreground">
            Let's book a time for your one-on-one consultation session to discuss your Creator Type profile.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">What to Expect</h3>
              <p className="text-sm text-muted-foreground">
                Our Creator Types expert will review your photos and discuss how your unique profile aligns with the 13 Creator Types. This session typically takes 45-60 minutes and is conducted via Zoom.
              </p>
            </div>
          </div>
        </div>

        {/* Calendly embed — shrink after booking to avoid blank space */}
        <div className="bg-card border border-border rounded-2xl p-0 overflow-hidden mb-8">
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/creatortypes/ahara-chat?hide_event_type_details=1&hide_gdpr_block=1"
            style={{ minWidth: "320px", height: calendlyBooked ? "520px" : "700px", transition: "height 0.3s ease" }}
          />
        </div>

        {/* After booking info */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">After You Book</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>You'll receive a confirmation email with the Zoom link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>Join 5-10 minutes early to test audio and video</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>Have your {tierInfo.name} membership details ready</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Always show date/time entry so we capture booking details */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            {calendlyBooked ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {calendlyBooked ? "Booking Confirmed!" : "Enter Your Booking Details"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please enter the date and time you booked so we can display it on your dashboard.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
            <div>
              <Label htmlFor="booking-date" className="text-xs font-medium text-foreground">Date</Label>
              <Input
                id="booking-date"
                type="date"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="booking-time" className="text-xs font-medium text-foreground">Time</Label>
              <Input
                id="booking-time"
                type="time"
                value={manualTime}
                onChange={e => setManualTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            disabled={!manualDate || !manualTime}
            onClick={async () => {
              if (user) {
                // Build scheduled_at from calendly event or manual input
                let scheduledAt = calendlyEventTime || null;
                if (!scheduledAt && manualDate && manualTime) {
                  scheduledAt = new Date(`${manualDate}T${manualTime}`).toISOString();
                }
                
                await supabase.from("bookings").insert({
                  client_id: user.id,
                  status: "scheduled",
                  scheduled_at: scheduledAt,
                  zoom_link: calendlyZoomLink || null,
                });
                await supabase.from("profiles").update({ enrollment_step: "booking_made" }).eq("user_id", user.id);
              }
              const returnTo = params.get("returnTo");
              navigate(returnTo || "/dashboard");
            }}
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            I've Booked — Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={async () => {
              if (user) {
                await supabase.from("profiles").update({ enrollment_step: "photos_uploaded" }).eq("user_id", user.id);
              }
              navigate("/dashboard");
            }}
            variant="outline"
            size="lg"
            className="rounded-full px-10 text-base font-semibold"
          >
            Skip for Now
          </Button>
        </div>
      </main>

    </div>
  );
}
