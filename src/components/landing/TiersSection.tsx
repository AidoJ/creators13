import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import levelCard1 from "@/assets/level-card-1.png";
import levelCard2 from "@/assets/level-card-2.png";
import levelCard3 from "@/assets/level-card-3.png";
import levelCard4 from "@/assets/level-card-4.png";
import levelsBg from "@/assets/levels-bg.png";

const tiers = [
  {
    name: "Wren",
    subtitle: "Explorer",
    image: levelCard1,
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
    color: "text-green-600",
  },
  {
    name: "Robin",
    subtitle: "Seeker",
    image: levelCard2,
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
    color: "text-orange-500",
  },
  {
    name: "Falcon",
    subtitle: "Achiever",
    image: levelCard3,
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
    color: "text-blue-600",
  },
  {
    name: "Owl",
    subtitle: "Practitioner Training",
    image: levelCard4,
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
    color: "text-purple-600",
  },
];

export function TiersSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="tiers" className="relative py-24 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${levelsBg})` }}
      />
      <div className="absolute inset-0 bg-background/95" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Click On Your Level To Get Started
          </h2>
          <p className="text-muted-foreground text-lg">
            (Newbies to the Creator Types… Yes, you START at the start!)
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 mt-8">
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

        {/* Level cards with pricing */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl bg-card",
                tier.popular
                  ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                  : "border-border hover:border-primary/30"
              )}
            >
              {tier.popular && (
                <span className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              {/* Level card image */}
              <div className="relative">
                <img
                  src={tier.image}
                  alt={`${tier.name} level`}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>

              {/* Pricing + features */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className={cn("text-2xl font-display font-bold", tier.color)}>{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.subtitle}</p>
                <div className="mb-5">
                  <span className="text-4xl font-display font-bold text-foreground">
                    ${annual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">/mo</span>
                  {annual && tier.annualPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${tier.annualPrice} billed annually
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className={cn(
                      "w-full rounded-full font-semibold",
                    )}
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
