import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setDestination("/enroll");
      return;
    }

    (async () => {
      try {
        const [profileRes, subRes, photosRes, bookingRes, cpRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("enrollment_step, first_name, date_of_birth, gender, height_cm")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("tier, status")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiling_photos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("bookings")
            .select("id")
            .eq("client_id", user.id)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("client_practitioner")
            .select("practitioner_id")
            .eq("client_id", user.id)
            .eq("active", true)
            .limit(1),
        ]);

        const profile = profileRes.data;
        const sub = subRes.data as { tier?: string; status?: string } | null;
        const photoCount = photosRes.count || 0;
        const hasBooking = !!bookingRes.data;
        const hasPractitioner = !!(cpRes.data && cpRes.data.length > 0);
        const step = profile?.enrollment_step || null;

        // Already complete → dashboard
        if (step === "complete" || step === "awaiting_profiling" || step === "booking_made") {
          setDestination("/dashboard");
          return;
        }

        // No subscription/tier → start over
        if (!sub?.tier) {
          setDestination("/enroll");
          return;
        }

        // Pick a practitioner first
        if (!hasPractitioner) {
          setDestination(`/enroll/practitioner?tier=${sub.tier}`);
          return;
        }

        const hasDetails = !!(
          profile?.first_name &&
          profile?.date_of_birth &&
          profile?.gender &&
          profile?.height_cm
        );
        if (!hasDetails) {
          setDestination(`/enroll/details?tier=${sub.tier}`);
          return;
        }

        if (photoCount === 0) {
          setDestination(`/enroll/photos?tier=${sub.tier}`);
          return;
        }

        if (!hasBooking && sub.tier !== "wren") {
          setDestination(`/enroll/booking?tier=${sub.tier}`);
          return;
        }

        setDestination("/dashboard");
      } catch (e) {
        console.error("Index routing error:", e);
        setDestination("/dashboard");
      }
    })();
  }, [user, loading]);

  if (loading || !destination) return null;
  return <Navigate to={destination} replace />;
};

export default Index;
