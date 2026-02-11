import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg-original.png";
import creatorFigure from "@/assets/creator-figure.png";
import creatorTypesStrip from "@/assets/creator-types-strip.png";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,100%,55%)]/40 via-transparent to-[hsl(220,100%,55%)]/30" />

      <div className="relative z-10 container mx-auto px-4 text-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Creator figure */}
          <img
            src={creatorFigure}
            alt="Creator Blueprint figure"
            className="w-40 md:w-56 lg:w-64 mb-4 drop-shadow-2xl"
          />

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white mb-2 leading-none tracking-wider uppercase"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
          >
            Creator
          </h1>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-8 leading-none"
            style={{ 
              color: "hsl(330, 100%, 50%)",
              textShadow: "0 2px 15px rgba(255,0,128,0.4)",
              fontStyle: "italic"
            }}
          >
            Blueprint
          </h2>

          {/* Creator types icon strip */}
          <motion.img
            src={creatorTypesStrip}
            alt="13 Creator Type icons"
            className="w-full max-w-lg md:max-w-xl mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />

          <p className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-[0.2em] mb-1"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
          >
            Create + Come Alive
          </p>
          <p className="text-lg md:text-xl font-display text-white/90 mb-10 tracking-wider">
            with <span className="text-[hsl(0,100%,50%)]">C</span>
            <span className="text-[hsl(30,100%,50%)]">R</span>
            <span className="text-[hsl(120,80%,40%)]">E</span>
            <span className="text-[hsl(280,100%,50%)]">A</span>
            <span className="text-[hsl(50,100%,50%)]">T</span>
            <span className="text-[hsl(200,100%,50%)]">O</span>
            <span className="text-[hsl(0,100%,50%)]">R</span>
            {" "}TYPES
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="rounded-none px-10 text-lg h-14 shadow-lg bg-white text-foreground hover:bg-white/90 font-display font-bold uppercase tracking-wider">
                Get Profiled
              </Button>
            </Link>
            <a href="#about">
              <Button
                size="lg"
                className="rounded-none px-10 text-lg h-14 bg-white text-foreground hover:bg-white/90 font-display font-bold uppercase tracking-wider"
              >
                Profile Yourself
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
