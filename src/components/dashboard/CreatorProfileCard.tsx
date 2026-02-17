import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Lock } from "lucide-react";

// Map creator type name → glyph asset filename
const GLYPH_IMPORTS: Record<string, () => Promise<{ default: string }>> = {
  lava: () => import("@/assets/glyph-lava.png"),
  fire: () => import("@/assets/glyph-fire.png"),
  whirlwind: () => import("@/assets/glyph-whirlwind.png"),
  sun: () => import("@/assets/glyph-sun.png"),
  lightning: () => import("@/assets/glyph-lightning.png"),
  sky: () => import("@/assets/glyph-sky.png"),
  mountain: () => import("@/assets/glyph-mountain.png"),
  tree: () => import("@/assets/glyph-tree.png"),
  soil: () => import("@/assets/glyph-soil.png"),
  river: () => import("@/assets/glyph-river.png"),
  ocean: () => import("@/assets/glyph-ocean.png"),
  lake: () => import("@/assets/glyph-lake.png"),
  snow: () => import("@/assets/glyph-snow.png"),
};

interface CreatorProfileCardProps {
  userId: string;
}

interface ProfileResult {
  primary_type: string | null;
  secondary_type: string | null;
  profiled_at: string | null;
  profiling_data: Record<string, unknown> | null;
}

interface CreatorTypeInfo {
  name: string;
  family: string;
  element: string;
  team_role: string | null;
  creative_power: string | null;
  natural_power: string | null;
  disaster_state: string | null;
  energy_pattern: string | null;
  color_hex: string | null;
}

export default function CreatorProfileCard({ userId }: CreatorProfileCardProps) {
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [typeInfo, setTypeInfo] = useState<CreatorTypeInfo | null>(null);
  const [secondaryInfo, setSecondaryInfo] = useState<CreatorTypeInfo | null>(null);
  const [glyphUrl, setGlyphUrl] = useState<string | null>(null);
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

  // Fetch creator type details when profile loads
  useEffect(() => {
    if (!profile?.primary_type) return;

    async function fetchTypeInfo() {
      const names = [profile!.primary_type!];
      if (profile!.secondary_type) names.push(profile!.secondary_type);

      const { data } = await supabase
        .from("creator_types")
        .select("name, family, element, team_role, creative_power, natural_power, disaster_state, energy_pattern, color_hex")
        .in("name", names);

      if (data) {
        const primary = data.find(d => d.name.toLowerCase() === profile!.primary_type!.toLowerCase());
        const secondary = data.find(d => d.name.toLowerCase() === profile!.secondary_type?.toLowerCase());
        if (primary) setTypeInfo(primary);
        if (secondary) setSecondaryInfo(secondary);
      }

      // Load glyph
      const key = profile!.primary_type!.toLowerCase();
      if (GLYPH_IMPORTS[key]) {
        try {
          const mod = await GLYPH_IMPORTS[key]();
          setGlyphUrl(mod.default);
        } catch { /* no glyph available */ }
      }
    }
    fetchTypeInfo();
  }, [profile]);

  const hasProfile = profile?.primary_type;

  if (loading) return null;

  if (hasProfile && typeInfo) {
    const color = typeInfo.color_hex || "hsl(var(--primary))";

    return (
      <div
        className="rounded-2xl border bg-gradient-to-br from-card via-card to-secondary/5 p-6 space-y-4"
        style={{ borderColor: `${color}30` }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-display font-bold text-foreground">Your Creator Type</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Glyph */}
          {glyphUrl && (
            <div className="flex-shrink-0">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center p-3"
                style={{ backgroundColor: `${color}15` }}
              >
                <img src={glyphUrl} alt={typeInfo.name} className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <p className="text-3xl font-display font-bold capitalize" style={{ color }}>
              {typeInfo.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{typeInfo.family}</span> · {typeInfo.element}
            </p>
            {typeInfo.team_role && (
              <p className="text-sm text-muted-foreground">{typeInfo.team_role}</p>
            )}
            {secondaryInfo && (
              <p className="text-sm text-muted-foreground">
                Secondary: <span className="font-semibold text-foreground capitalize">{secondaryInfo.name}</span>
                <span className="ml-1 text-xs">({secondaryInfo.family})</span>
              </p>
            )}
            {profile.profiled_at && (
              <p className="text-xs text-muted-foreground">
                Profiled on {new Date(profile.profiled_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground flex-shrink-0">
            {typeInfo.creative_power && (
              <div>
                <span className="font-semibold text-foreground">Creative Power</span>
                <p>{typeInfo.creative_power}</p>
              </div>
            )}
            {typeInfo.natural_power && (
              <div>
                <span className="font-semibold text-foreground">Natural Power</span>
                <p>{typeInfo.natural_power}</p>
              </div>
            )}
            {typeInfo.energy_pattern && (
              <div>
                <span className="font-semibold text-foreground">Energy Pattern</span>
                <p>{typeInfo.energy_pattern}</p>
              </div>
            )}
            {typeInfo.disaster_state && (
              <div>
                <span className="font-semibold text-foreground">Disaster State</span>
                <p>{typeInfo.disaster_state}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Coming soon state
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/3 p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative text-center space-y-3 py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary/60" />
        </div>
        <h2 className="text-lg font-display font-bold text-foreground">Your Creator Type</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Your profile is being assessed by your practitioner. Results will appear here once assigned!
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3 w-3" /> Coming Soon
        </div>
      </div>
    </div>
  );
}
