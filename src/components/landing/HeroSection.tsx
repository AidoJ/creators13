import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import creatorFigure from "@/assets/creator-figure.png";
import creatorTypesStrip from "@/assets/creator-types-strip.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-foreground">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(30,10%,8%)] via-[hsl(43,30%,12%)] to-[hsl(150,20%,10%)]" />
      
      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-6">
              Creator Types™
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[0.95] mb-6">
              Creator
              <br />
              <span className="text-primary">Blueprint</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-md mb-4 font-body leading-relaxed">
              12 body types. 12 forces of nature. Unlimited creative power. Discover the template 
              your body was built from.
            </p>
            <p className="text-sm text-white/40 mb-10 font-body">
              Create + Come Alive with Creator Types
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold shadow-[0_0_30px_hsl(43,65%,53%,0.3)]">
                  Get Profiled
                </Button>
              </Link>
              <a href="#about">
                <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-base font-semibold border-white/20 text-white hover:bg-white/5">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Right — figure + icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent rounded-full blur-3xl scale-110" />
              <img
                src={creatorFigure}
                alt="Creator Blueprint — body profiling figure"
                className="relative w-64 md:w-80 lg:w-96 drop-shadow-[0_20px_60px_rgba(212,175,55,0.2)]"
              />
            </div>
            <img
              src={creatorTypesStrip}
              alt="The 13 Creator Type archetypes"
              className="w-full max-w-sm mt-6 opacity-80"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
