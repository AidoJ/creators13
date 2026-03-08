import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIERS, type TierKey } from "@/lib/tiers";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
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

  // Determine "What's Next?" prompt
  const getNextStep = () => {
    if (!enrollmentStep || enrollmentStep === "plan_selected" || enrollmentStep === "signed_up")
      return { label: "Complete your personal details", link: "/enroll/details" };
    if (enrollmentStep === "payment_complete")
      return { label: "Upload your profiling photos", link: "/enroll/photos" };
    if (enrollmentStep === "photos_uploaded")
      return { label: "Book your profiling session", link: "/enroll/booking" };
    if (enrollmentStep === "booking_made" || enrollmentStep === "awaiting_profiling")
      return { label: "Your profile is being reviewed", link: null };
    return null; // complete
  };
  const nextStep = getNextStep();

  const isAustralia = country?.toLowerCase().includes("australia") || country?.toLowerCase() === "au";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:p-8 shadow-lg shadow-primary/5">
      {/* Background image */}
      <img src={welcomeBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-card/60" />

      {/* Decorative background elements */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-secondary/15 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-accent/10 blur-xl" />

      <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Left: Name, glyphs, tier */}
        <div className="space-y-2 flex-1">
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
              {birdSrc && (
                <img
                  src={birdSrc}
                  alt={tierData.name || "Tier"}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              )}
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

        {/* Right: What's Next? */}
        <div className="flex flex-col items-center gap-2 shrink-0 min-w-[140px]">
          {nextStep ? (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">What's Next?</span>
              <p className="text-xs text-muted-foreground text-center max-w-[160px]">{nextStep.label}</p>
              {nextStep.link && (
                <Button size="sm" className="mt-1" asChild>
                  <a href={nextStep.link}>Continue <ArrowRight className="h-3 w-3 ml-1" /></a>
                </Button>
              )}
            </>
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
          )}
          {isAustralia && (
            <Button variant="outline" size="sm" className="mt-2 gap-1.5" asChild>
              <a href="https://www.paypal.com/ncp/payment/Q5UNQG7THTWQW" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-3.5 w-3.5" />
                Buy the 13Creators Book
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
