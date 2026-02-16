import { Badge } from "@/components/ui/badge";
import { TIERS, type TierKey } from "@/lib/tiers";
import { Sparkles } from "lucide-react";

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

interface WelcomeHeroProps {
  firstName?: string | null;
  tier?: TierKey | null;
  subscriptionStatus?: string | null;
  statusLabel: string;
  statusColor: string;
}

export default function WelcomeHero({ firstName, tier, subscriptionStatus, statusLabel, statusColor }: WelcomeHeroProps) {
  const tierData = tier ? TIERS[tier] : null;
  const birdSrc = tier ? TIER_BIRDS[tier] : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 sm:p-8 shadow-lg shadow-primary/5">
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
            <Badge className={statusColor}>{statusLabel}</Badge>
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
          />
        )}
      </div>
    </div>
  );
}
