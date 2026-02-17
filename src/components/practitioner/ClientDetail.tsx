import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CompositePhotoLayout from "@/components/profiling/CompositePhotoLayout";
import CreatorTypeAssignmentForm from "@/components/practitioner/CreatorTypeAssignmentForm";
import ClientSubscriptionCard from "@/components/practitioner/ClientSubscriptionCard";
import { User, Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  enrollment_step: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  shoe_size: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  case_study_consent_at: string | null;
}

interface BookingData {
  scheduled_at: string | null;
  status: string | null;
  zoom_link: string | null;
}

interface CreatorTypeData {
  primary_type: string | null;
  secondary_type: string | null;
  profiled_at: string | null;
}

interface ClientDetailProps {
  clientId: string;
  onClientNameLoaded?: (name: string) => void;
}

export default function ClientDetail({ clientId, onClientNameLoaded }: ClientDetailProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [creatorType, setCreatorType] = useState<CreatorTypeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientData() {
      setLoading(true);
      const [profileRes, bookingRes, ctRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, email, enrollment_step, date_of_birth, gender, height_cm, shoe_size, city, state, country, case_study_consent_at").eq("user_id", clientId).maybeSingle(),
        supabase.from("bookings").select("scheduled_at, status, zoom_link").eq("client_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("creator_type_profiles").select("primary_type, secondary_type, profiled_at").eq("user_id", clientId).maybeSingle(),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        const name = `${profileRes.data.first_name || ""} ${profileRes.data.last_name || ""}`.trim();
        onClientNameLoaded?.(name || "Unknown");
      }
      if (bookingRes.data) setBooking(bookingRes.data);
      if (ctRes.data) setCreatorType(ctRes.data);
      setLoading(false);
    }
    fetchClientData();
  }, [clientId, onClientNameLoaded]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading client details…</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Client profile not found.</div>;
  }

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-foreground">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.enrollment_step && (
                <Badge variant="outline" className="text-xs capitalize">
                  {profile.enrollment_step.replace(/_/g, " ")}
                </Badge>
              )}
              {creatorType?.primary_type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {creatorType.primary_type}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${profile.case_study_consent_at ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted/50 text-muted-foreground border-border"}`}
              >
                Consent: {profile.case_study_consent_at ? "Given" : "Not Given"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          {profile.gender && (
            <div>
              <span className="text-muted-foreground text-xs">Gender</span>
              <p className="font-medium text-foreground capitalize">{profile.gender}</p>
            </div>
          )}
          {profile.date_of_birth && (
            <div>
              <span className="text-muted-foreground text-xs">DOB</span>
              <p className="font-medium text-foreground">{new Date(profile.date_of_birth).toLocaleDateString("en-AU")}</p>
            </div>
          )}
          {profile.height_cm && (
            <div>
              <span className="text-muted-foreground text-xs">Height</span>
              <p className="font-medium text-foreground">{profile.height_cm} cm</p>
            </div>
          )}
          {profile.shoe_size && (
            <div>
              <span className="text-muted-foreground text-xs">Shoe Size</span>
              <p className="font-medium text-foreground">{profile.shoe_size}</p>
            </div>
          )}
          {(profile.city || profile.state || profile.country) && (
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs">Location</span>
              <p className="font-medium text-foreground">
                {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking info */}
      {booking?.scheduled_at && (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Session: {new Date(booking.scheduled_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-muted-foreground capitalize">Status: {booking.status || "scheduled"}</p>
          </div>
          {booking.zoom_link && (
            <a href={booking.zoom_link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-primary hover:underline">
              Join Zoom
            </a>
          )}
        </div>
      )}

      {/* Subscription info */}
      <ClientSubscriptionCard clientId={clientId} />

      {/* Creator Type Assignment */}
      <CreatorTypeAssignmentForm clientId={clientId} clientName={fullName} />

      {/* Photo composite */}
      <CompositePhotoLayout userId={clientId} subjectName={`${fullName}'s Profiling Photos`} />
    </div>
  );
}
