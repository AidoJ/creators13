import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import creatorFigure from "@/assets/creator-figure.png";
import creatorTypesStrip from "@/assets/creator-types-strip.png";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Full-bleed background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Blue overlay for vibrancy */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/40 via-blue-500/20 to-blue-900/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-16">
        {/* Creator figure */}
        <motion.img
          src={creatorFigure}
          alt="Creator Blueprint figure"
          className="w-48 md:w-64 lg:w-72 drop-shadow-[0_10px_40px_rgba(255,255,255,0.2)] mb-4"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <h1 className="font-display font-bold leading-none">
            <span className="block text-6xl md:text-8xl lg:text-9xl text-white tracking-[0.08em] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              CREATOR
            </span>
            <span className="block text-5xl md:text-7xl lg:text-8xl text-pink-500 italic drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Blueprint
            </span>
          </h1>
        </motion.div>

        {/* Creator Types icon strip */}
        <motion.img
          src={creatorTypesStrip}
          alt="The 13 Creator Type archetypes"
          className="w-72 md:w-96 mt-6 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        />

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <p className="text-lg md:text-xl font-display uppercase tracking-[0.2em] font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            Create + Come Alive
          </p>
          <p className="text-base md:text-lg font-display tracking-wider text-white/90 mt-1">
            with{" "}
            <span className="text-red-500 font-bold">C</span>
            <span className="text-orange-400 font-bold">R</span>
            <span className="text-green-500 font-bold">E</span>
            <span className="text-purple-500 font-bold">A</span>
            <span className="text-yellow-400 font-bold">T</span>
            <span className="text-blue-400 font-bold">O</span>
            <span className="text-red-500 font-bold">R</span>
            {" "}TYPES
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-none px-12 h-16 text-lg font-display font-bold uppercase tracking-wider bg-white text-pink-600 hover:bg-white/90 shadow-xl min-w-[220px]"
            >
              Get<br />Profiled
            </Button>
          </Link>
          <a href="#about">
            <Button
              size="lg"
              className="rounded-none px-12 h-16 text-lg font-display font-bold uppercase tracking-wider bg-white text-blue-600 hover:bg-white/90 shadow-xl min-w-[220px]"
            >
              Profile<br />Yourself
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
