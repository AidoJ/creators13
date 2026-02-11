import { motion } from "framer-motion";
import creatorTypesIcons from "@/assets/creator-types-icons.png";

export function AboutSection() {
  return (
    <section id="about" className="py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4"
          >
            The Science of You
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight"
          >
            12 Body Types.<br />
            <span className="text-primary">12 Forces of Nature.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            The shape, structure, and features of your body form the template for everything you create.
            When you know how to operate your vehicle, you can create whatever your heart desires.
          </motion.p>
        </div>

        {/* Creator type icons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-20"
        >
          <img src={creatorTypesIcons} alt="The 12 Creator Type archetypes" className="w-full max-w-4xl" />
        </motion.div>

        {/* YouTube embed */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Watch: 12 Creator Types in 12 Minutes
          </p>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/N_hAuOoWFjM"
              title="12 CREATOR TYPES In 12 Minutes"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
