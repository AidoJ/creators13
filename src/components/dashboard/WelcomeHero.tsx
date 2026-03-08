import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TIERS, type TierKey } from "@/lib/tiers";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sortCreatorTypes } from "@/lib/creatorTypes";
import welcomeBg from "@/assets/welcome-bg.png";

import wrenImg from "@/assets/bird-wren.png";
import robinImg from "@/assets/bird-robin.png";
import falconImg from "@/assets/bird-falcon.png";
import owlImg from "@/assets/bird-owl.png";

const TIER_BIRDS: Record<string, string> = {
  wren: wrenImg,
  robin: robinImg,
  falcon: falconImg,
  owl: owlImg,
};

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

interface WelcomeHeroProps {
  firstName?: string | null;
  tier?: TierKey | null;
  subscriptionStatus?: string | null;
  statusLabel: string;
  statusColor: string;
  creatorTypes?: string[];
  showStatusBadge?: boolean;
  enrollmentStep?: string | null;
  country?: string | null;
}

export default function WelcomeHero({ firstName, tier, subscriptionStatus, statusLabel, statusColor, creatorTypes = [], showStatusBadge = true, enrollmentStep, country }: WelcomeHeroProps) {
  const tierData = tier ? TIERS[tier] : null;
  const birdSrc = tier ? TIER_BIRDS[tier] : null;

  const [glyphs, setGlyphs] = useState<{ name: string; url: string; color: string }[]>([]);

  useEffect(() => {
    if (creatorTypes.length === 0) return;

    async function loadGlyphs() {
      const sorted = sortCreatorTypes(creatorTypes);

      // Fetch color_hex for each type — match both cases in case stored lowercase
      const capitalised = sorted.map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase());
      const matchSet = [...new Set([...sorted, ...capitalised])];
      const { data: typesData } = await supabase
        .from("creator_types")
        .select("name, color_hex")
        .in("name", matchSet);

      const colorMap: Record<string, string> = {};
      typesData?.forEach(t => {
        colorMap[t.name.toLowerCase()] = t.color_hex || "hsl(var(--primary))";
      });

      const results: { name: string; url: string; color: string }[] = [];
      for (const name of sorted) {
        const key = name.toLowerCase();
        if (GLYPH_IMPORTS[key]) {
          try {
            const mod = await GLYPH_IMPORTS[key]();
            results.push({ name, url: mod.default, color: colorMap[key] || "hsl(var(--primary))" });
          } catch { /* skip */ }
        }
      }
      setGlyphs(results);
    }
    loadGlyphs();
  }, [creatorTypes]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:p-8 shadow-lg shadow-primary/5">
      {/* Background image */}
      <img src={welcomeBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-card/60" />

      {/* Decorative background elements */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-secondary/15 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-accent/10 blur-xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Welcome{firstName ? `, ${firstName}` : ""}!
            </h1>
            {glyphs.map(g => (
              <div
                key={g.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center p-1"
                style={{ backgroundColor: `${g.color}20` }}
                title={g.name}
              >
                <img src={g.url} alt={g.name} className="w-full h-full object-contain" />
              </div>
            ))}
            {showStatusBadge && <Badge className={statusColor}>{statusLabel}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Your Creator Type profiling journey — track your progress, view your photos, and discover your unique profile.
          </p>
          {tierData && (
            <div className="flex items-center gap-2 pt-1">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-foreground">
                {tierData.name} <span className="text-muted-foreground font-normal">· {tierData.subtitle}</span>
              </span>
              {subscriptionStatus && (
                <span className="text-xs text-muted-foreground capitalize">({subscriptionStatus})</span>
              )}
            </div>
          )}
        </div>
        {birdSrc && (
          <img
            src={birdSrc}
            alt={tierData?.name || "Tier"}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain opacity-80 shrink-0"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </div>
  );
}
