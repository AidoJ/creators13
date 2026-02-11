import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import creatorFigure from "@/assets/creator-figure.png";
import creatorTypesStrip from "@/assets/creator-types-strip.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(30,10%,10%) 0%, hsl(35,15%,14%) 40%, hsl(43,20%,12%) 70%, hsl(150,15%,10%) 100%)" }}>
      {/* Subtle grain */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-body text-sm font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: "hsl(43,65%,53%)" }}>
              Creator Types™
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] mb-6">
              <span style={{ color: "hsl(40,20%,92%)" }}>Creator</span>
              <br />
              <span style={{ color: "hsl(43,65%,53%)" }}>Blueprint</span>
            </h1>
            <p className="text-lg md:text-xl max-w-md mb-4 font-body leading-relaxed" style={{ color: "hsl(35,15%,65%)" }}>
              12 body types. 12 forces of nature. Unlimited creative power. Discover the template 
              your body was built from.
            </p>
            <p className="text-sm mb-10 font-body" style={{ color: "hsl(35,10%,45%)" }}>
              Create + Come Alive with Creator Types
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold shadow-[0_0_30px_hsl(43,65%,53%,0.3)] bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Profiled
                </Button>
              </Link>
              <a href="#about">
                <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-base font-semibold" style={{ borderColor: "hsl(35,15%,30%)", color: "hsl(40,20%,85%)" }}>
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Right — figure + tagline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/15 via-transparent to-transparent rounded-full blur-3xl scale-125" />
              <img
                src={creatorFigure}
                alt="Creator Blueprint — body profiling figure"
                className="relative w-64 md:w-80 lg:w-96 drop-shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
              />
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm md:text-base font-display uppercase tracking-[0.25em] font-semibold" style={{ color: "hsl(40,20%,85%)" }}>
                Make. Your. Body. Come. Alive
              </p>
              <p className="text-sm font-display mt-1 tracking-wider" style={{ color: "hsl(35,15%,60%)" }}>
                with{" "}
                <span style={{ color: "hsl(0,100%,60%)" }}>C</span>
                <span style={{ color: "hsl(30,100%,55%)" }}>R</span>
                <span style={{ color: "hsl(120,70%,45%)" }}>E</span>
                <span style={{ color: "hsl(280,80%,60%)" }}>A</span>
                <span style={{ color: "hsl(50,100%,55%)" }}>T</span>
                <span style={{ color: "hsl(200,100%,55%)" }}>O</span>
                <span style={{ color: "hsl(0,100%,60%)" }}>R</span>
                {" "}TYPES
              </p>
            </div>
            <img
              src={creatorTypesStrip}
              alt="The 13 Creator Type archetypes"
              className="w-full max-w-sm mt-6 opacity-70"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
