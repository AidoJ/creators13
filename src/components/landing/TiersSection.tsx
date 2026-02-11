import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Wren",
    subtitle: "Explorer",
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
    <section id="tiers" className="py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4">
            Your Journey
          </p>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
            Choose Your Path
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            From curious explorer to certified practitioner — find the tier that fits your journey.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
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
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl p-7 border transition-all duration-300 hover:shadow-xl",
                tier.popular
                  ? "border-primary bg-card shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-display font-bold text-foreground">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{tier.subtitle}</p>
              <div className="mb-7">
                <span className="text-5xl font-display font-bold text-foreground">
                  ${annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/mo</span>
                {annual && tier.annualPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${tier.annualPrice} billed annually
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button
                  className={cn(
                    "w-full rounded-full font-semibold",
                    tier.popular ? "" : ""
                  )}
                  variant={tier.popular ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
