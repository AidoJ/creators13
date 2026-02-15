import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, Calendar, User, CheckCircle } from "lucide-react";
import logo from "@/assets/13creators-logo.png";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  enrollment_step: string | null;
}

interface BookingData {
  scheduled_at: string | null;
  status: string | null;
  zoom_link: string | null;
}

interface SubData {
  tier: string;
  status: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [subscription, setSubscription] = useState<SubData | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch profile, latest booking, and subscription in parallel
    const fetchData = async () => {
      const [profileRes, bookingRes, subRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, enrollment_step").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookings").select("scheduled_at, status, zoom_link").eq("client_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("subscriptions").select("tier, status").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (bookingRes.data) setBooking(bookingRes.data);
      if (subRes.data) setSubscription(subRes.data);
    };
    fetchData();
  }, [user]);

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`
    : user?.email;

  // Determine profile review status
  const step = profile?.enrollment_step;
  const isComplete = step === "complete";
  const photosUploaded = step === "photos_uploaded" || step === "booking_made" || isComplete;
  const bookingMade = step === "booking_made" || isComplete;

  const statusLabel = isComplete
    ? "Complete"
    : photosUploaded
    ? "In Review"
    : "In Progress";

  const statusColor = isComplete
    ? "text-green-600 bg-green-500/10"
    : photosUploaded
    ? "text-amber-600 bg-amber-500/10"
    : "text-muted-foreground bg-muted/50";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="13 Creators" className="h-8" />
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}!
          </h1>
          <p className="text-muted-foreground">Here's the status of your Creator Type profiling journey.</p>
        </div>

        {/* Profile Status Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Status
            </h2>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {subscription && (
            <div className="text-sm text-muted-foreground">
              Plan: <span className="font-semibold text-foreground capitalize">{subscription.tier}</span>
              {" · "}
              <span className="capitalize">{subscription.status}</span>
            </div>
          )}

          {/* Progress steps */}
          <div className="space-y-2">
            {[
              { label: "Account created", done: true },
              { label: "Personal details added", done: step !== "plan_selected" && step !== "signed_up" },
              { label: "Photos uploaded", done: photosUploaded },
              { label: "Zoom session booked", done: bookingMade },
              { label: "Profiling complete", done: isComplete },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                {item.done ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Booking Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Session
          </h2>
          {booking?.scheduled_at ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">
                  {new Date(booking.scheduled_at).toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {" at "}
                {new Date(booking.scheduled_at).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-muted-foreground capitalize">Status: {booking.status || "scheduled"}</p>
              {booking.zoom_link && (
                <a
                  href={booking.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-primary font-semibold hover:underline mt-1"
                >
                  Join Zoom Meeting →
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {photosUploaded
                ? "Your photos are being reviewed. You'll be able to book once a practitioner has reviewed them."
                : "Complete your photos to unlock booking."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
