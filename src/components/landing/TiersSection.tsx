import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import origLevelsDivider from "@/assets/orig-levels-divider.png";
import birdWren from "@/assets/bird-wren.png";
import birdRobin from "@/assets/bird-robin.png";
import birdFalcon from "@/assets/bird-falcon.png";
import birdOwl from "@/assets/bird-owl.png";
import origStartHere from "@/assets/orig-start-here.png";

const tiers = [
  {
    name: "Wren",
    subtitle: "Explorer",
    image: birdWren,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Access community features",
      "Creator Type overview",
      "Basic profile",
      "Browse public content",
    ],
    cta: "Join Free",
    popular: false,
  },
  {
    name: "Robin",
    subtitle: "Seeker",
    image: birdRobin,
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      "Everything in Wren",
      "Full Creator Type profiling",
      "8-photo analysis",
      "1-on-1 Zoom session",
      "Personal dashboard",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Falcon",
    subtitle: "Achiever",
    image: birdFalcon,
    monthlyPrice: 59,
    annualPrice: 590,
    features: [
      "Everything in Robin",
      "Ongoing coaching sessions",
      "Advanced profiling insights",
      "Priority booking",
      "Training resources",
    ],
    cta: "Level Up",
    popular: false,
  },
  {
    name: "Owl",
    subtitle: "Practitioner Training",
    image: birdOwl,
    monthlyPrice: 149,
    annualPrice: 1490,
    features: [
      "Everything in Falcon",
      "Full LMS access",
      "Practitioner certification path",
      "Case study creation",
      "Client management tools",
      "Assessment & evaluation",
    ],
    cta: "Apply Now",
    popular: false,
  },
];

export function TiersSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="tiers" className="bg-white">
      {/* Divider from original */}
      <div>
        <img src={origLevelsDivider} alt="" className="w-full block" />
      </div>

      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Click On Your Level To Get Started
          </h2>
          <p className="text-muted-foreground text-base mb-2">
            (Newbies to the Creator Types…
          </p>
          <p className="text-muted-foreground text-base mb-8">
            Yes, you START at the start!)
          </p>

          {/* Start Here arrow */}
          <img src={origStartHere} alt="Start here" className="w-48 mx-auto mb-8" />

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 mb-12">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
                !annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
                annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual <span className="text-xs opacity-75 ml-1">Save 17%</span>
            </button>
          </div>

          {/* Level cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-2xl overflow-hidden border bg-white transition-all duration-300 hover:shadow-xl",
                  tier.popular
                    ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                    : "border-border hover:border-primary/30"
                )}
              >
                {tier.popular && (
                  <span className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                )}

                {/* Original level card image */}
                <img
                  src={tier.image}
                  alt={`${tier.name} level`}
                  className="w-full"
                />

                {/* Pricing */}
                <div className="p-5 flex flex-col flex-1 text-left">
                  <h3 className="text-xl font-display font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{tier.subtitle}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-display font-bold text-foreground">
                      ${annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/mo</span>
                    {annual && tier.annualPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${tier.annualPrice} billed annually
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button
                      className="w-full rounded-full font-semibold text-sm"
                      variant={tier.popular ? "default" : "outline"}
                      size="sm"
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div>
        <img src={origLevelsDivider} alt="" className="w-full block" />
      </div>
    </section>
  );
}
