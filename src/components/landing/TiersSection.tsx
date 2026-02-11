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
    <section id="tiers" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Choose Your Path
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            From curious explorer to certified practitioner — find the tier that fits your journey.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                !annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Annual <span className="text-xs opacity-75">Save 17%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-2xl p-6 border transition-shadow hover:shadow-lg",
                tier.popular
                  ? "border-primary bg-background shadow-md ring-2 ring-primary/20"
                  : "border-border bg-background"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-display font-bold text-foreground">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{tier.subtitle}</p>
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">
                  ${annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice}
                </span>
                <span className="text-muted-foreground text-sm">/mo</span>
                {annual && tier.annualPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${tier.annualPrice} billed annually
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button
                  className="w-full rounded-full"
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
