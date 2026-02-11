import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import levelsBg from "@/assets/levels-bg.png";
import levelIcons from "@/assets/level-icons.png";
import levelCard1 from "@/assets/level-card-1.png";
import levelCard2 from "@/assets/level-card-2.png";
import levelCard3 from "@/assets/level-card-3.png";
import levelCard4 from "@/assets/level-card-4.png";

export function LevelsSection() {
  return (
    <section id="tiers" className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${levelsBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <img src={levelIcons} alt="Level icons" className="w-full max-w-xs mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Click On Your Level To Get Started
          </h2>
          <p className="text-lg text-white/80 mb-12">
            (Newbies to the Creator Types… Yes, you START at the start!)
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
          {[levelCard1, levelCard2, levelCard3, levelCard4].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to="/auth">
                <img
                  src={card}
                  alt={`Level ${i + 1}`}
                  className="w-full rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
                />
              </Link>
            </motion.div>
          ))}
        </div>

        <Link to="/auth">
          <Button size="lg" className="rounded-none px-12 text-lg h-14 bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider">
            &lt; Start Here &gt;
          </Button>
        </Link>
      </div>
    </section>
  );
}
