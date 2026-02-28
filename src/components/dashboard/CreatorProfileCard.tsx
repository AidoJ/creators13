import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Lock, Zap, AlertTriangle, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  type_3: string | null;
  type_4: string | null;
  profiled_at: string | null;
}

interface ProfileContent {
  tagline?: string;
  magical_qualities?: string[];
  challenges?: string[];
  physical_features?: string[];
  description?: string;
  natural_state?: {
    title?: string;
    traits?: string[];
  };
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
  profile_content: ProfileContent | null;
}

export default function CreatorProfileCard({ userId }: CreatorProfileCardProps) {
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [typeInfos, setTypeInfos] = useState<CreatorTypeInfo[]>([]);
  const [glyphUrls, setGlyphUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("creator_type_profiles")
        .select("primary_type, secondary_type, type_3, type_4, profiled_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setProfile(data as ProfileResult);
      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!profile?.primary_type) return;

    async function fetchTypeInfo() {
      const names: string[] = [profile!.primary_type!];
      if (profile!.secondary_type) names.push(profile!.secondary_type);
      if (profile!.type_3) names.push(profile!.type_3);
      if (profile!.type_4) names.push(profile!.type_4);

      const { data: typesData } = await supabase
        .from("creator_types")
        .select("name, family, element, team_role, creative_power, natural_power, disaster_state, energy_pattern, color_hex, profile_content")
        .in("name", names);

      if (typesData) {
        const ordered = names
          .map(n => typesData.find(d => d.name.toLowerCase() === n.toLowerCase()))
          .filter(Boolean) as CreatorTypeInfo[];
        setTypeInfos(ordered);

        // Load glyphs for all types
        const urls: Record<string, string> = {};
        for (const info of ordered) {
          const key = info.name.toLowerCase();
          if (GLYPH_IMPORTS[key]) {
            try {
              const mod = await GLYPH_IMPORTS[key]();
              urls[key] = mod.default;
            } catch { /* no glyph */ }
          }
        }
        setGlyphUrls(urls);
      }
    }
    fetchTypeInfo();
  }, [profile]);

  if (loading) return null;

  const primaryInfo = typeInfos[0];

  if (!profile?.primary_type || !primaryInfo) {
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

  const defaultColor = primaryInfo.color_hex || "hsl(var(--primary))";

  return (
    <div
      className="rounded-2xl border bg-gradient-to-br from-card via-card to-secondary/5 p-6 space-y-4"
      style={{ borderColor: `${defaultColor}30` }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-secondary" />
        <h2 className="text-lg font-display font-bold text-foreground">
          Your Creator Type{typeInfos.length > 1 ? "s" : ""}
        </h2>
        {profile.profiled_at && (
          <span className="ml-auto text-xs text-muted-foreground">
            Profiled {new Date(profile.profiled_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>

      {typeInfos.length === 1 ? (
        <TypePanel info={primaryInfo} glyphUrl={glyphUrls[primaryInfo.name.toLowerCase()]} slotLabel="Type 1" />
      ) : (
        <Tabs defaultValue={primaryInfo.name.toLowerCase()} className="w-full">
          <TabsList className="w-full flex gap-1 bg-transparent p-1">
            {typeInfos.map((info, idx) => {
              const glyph = glyphUrls[info.name.toLowerCase()];
              const tabColor = info.color_hex || "hsl(var(--primary))";
              return (
                <TabsTrigger
                  key={info.name}
                  value={info.name.toLowerCase()}
                  className="flex-1 flex items-center gap-2 rounded-lg text-white/90 font-semibold transition-all data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-white data-[state=inactive]:opacity-75"
                  style={{
                    backgroundColor: tabColor,
                  }}
                >
                  {glyph && (
                    <img src={glyph} alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                  )}
                  <span className="capitalize">{info.name}</span>
                  <span className="hidden sm:inline text-[10px] opacity-80">(Type {idx + 1})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {typeInfos.map((info, idx) => (
              <TabsContent key={info.name} value={info.name.toLowerCase()} className="mt-4">
                <TypePanel
                  info={info}
                  glyphUrl={glyphUrls[info.name.toLowerCase()]}
                  slotLabel={`Type ${idx + 1}`}
                />
              </TabsContent>
            ))}
        </Tabs>
      )}
    </div>
  );
}

/* ─── Single type panel (reused per tab) ─── */
function TypePanel({ info, glyphUrl, slotLabel }: { info: CreatorTypeInfo; glyphUrl?: string; slotLabel: string }) {
  const color = info.color_hex || "hsl(var(--primary))";
  const content = info.profile_content;

  return (
    <div className="space-y-5">
      {/* Hero row */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {glyphUrl && (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center p-3 flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <img src={glyphUrl} alt={info.name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <p className="text-2xl font-display font-bold capitalize" style={{ color }}>
              {info.name}
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ borderColor: `${color}40`, color }}>
              {slotLabel}
            </span>
          </div>
          {content?.tagline && (
            <p className="text-sm italic text-muted-foreground">{content.tagline}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">Family:</span> {info.family}</span>
            <span><span className="font-semibold text-foreground">Element:</span> {info.element}</span>
            {info.team_role && <span><span className="font-semibold text-foreground">Team Role:</span> {info.team_role}</span>}
          </div>
        </div>
      </div>

      {/* Qualities & Challenges */}
      {content && (content.magical_qualities || content.challenges) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {content.magical_qualities && content.magical_qualities.length > 0 && (
            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: `${color}08` }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5" style={{ color }} />
                Magical Qualities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {content.magical_qualities.map(q => (
                  <span key={q} className="text-[11px] font-medium px-2 py-0.5 rounded-full border" style={{ borderColor: `${color}40`, color }}>
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}
          {content.challenges && content.challenges.length > 0 && (
            <div className="rounded-xl bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                Challenges
              </div>
              <div className="flex flex-wrap gap-1.5">
                {content.challenges.map(c => (
                  <span key={c} className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Physical Features */}
      {content?.physical_features && content.physical_features.length > 0 && (
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Eye className="h-3.5 w-3.5 text-secondary" />
            Key Physical Features
          </div>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pl-1">
            {content.physical_features.map(f => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Description */}
      {content?.description && (
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
          {content.description}
        </p>
      )}

      {/* Natural State */}
      {content?.natural_state && (
        <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: `${color}06`, borderLeft: `3px solid ${color}` }}>
          <p className="text-sm font-display font-bold text-foreground">
            {content.natural_state.title && <>{content.natural_state.title} — </>}
            When you embody <span className="capitalize" style={{ color }}>{info.name}</span> in its Natural State…
          </p>
          {content.natural_state.traits && (
            <ul className="space-y-1.5">
              {content.natural_state.traits.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
