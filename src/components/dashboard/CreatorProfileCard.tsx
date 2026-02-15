import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Lock } from "lucide-react";

// Map of creator type key → glyph asset
const GLYPH_MAP: Record<string, string> = {};
// We'll dynamically load them if the type is known

interface CreatorProfileCardProps {
  userId: string;
  isComplete: boolean;
}

interface ProfileResult {
  primary_type: string | null;
  secondary_type: string | null;
  profiled_at: string | null;
  profiling_data: Record<string, unknown> | null;
}

export default function CreatorProfileCard({ userId, isComplete }: CreatorProfileCardProps) {
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("creator_type_profiles")
        .select("primary_type, secondary_type, profiled_at, profiling_data")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) setProfile(data as ProfileResult);
      setLoading(false);
    }
    load();
  }, [userId]);

  const hasProfile = profile?.primary_type;

  if (loading) return null;

  if (hasProfile) {
    return (
      <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-card via-card to-secondary/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-display font-bold text-foreground">Your Creator Type</h2>
        </div>
        <div className="text-center py-4 space-y-2">
          <p className="text-3xl font-display font-bold text-primary capitalize">{profile.primary_type}</p>
          {profile.secondary_type && (
            <p className="text-sm text-muted-foreground">
              Secondary: <span className="font-semibold text-foreground capitalize">{profile.secondary_type}</span>
            </p>
          )}
          {profile.profiled_at && (
            <p className="text-xs text-muted-foreground">
              Profiled on {new Date(profile.profiled_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Coming soon state
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/3 p-6 relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative text-center space-y-3 py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary/60" />
        </div>
        <h2 className="text-lg font-display font-bold text-foreground">Your Creator Type</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {isComplete
            ? "Your profile is being assessed by our practitioner. Results will appear here soon!"
            : "Complete your enrollment to unlock your unique Creator Type profile."}
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3 w-3" /> Coming Soon
        </div>
      </div>
    </div>
  );
}
