import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/50 to-background" />

      <div className="relative z-10 container mx-auto px-4 text-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-cream mb-6 leading-tight">
            Discover Your
            <span className="block text-primary">Creator Type</span>
          </h1>
          <p className="text-lg md:text-xl text-cream/80 max-w-2xl mx-auto mb-10 font-body">
            Unlock the 13 forces of nature within you. A transformative profiling system
            connecting body, mind, and purpose through the wisdom of natural archetypes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="rounded-full px-10 text-lg h-14 shadow-lg">
                Begin Your Journey
              </Button>
            </Link>
            <a href="#about">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-10 text-lg h-14 border-cream/30 text-cream hover:bg-cream/10"
              >
                Learn More
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
