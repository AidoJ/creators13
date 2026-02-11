import { motion } from "framer-motion";
import bodyTypesArrows from "@/assets/body-types-arrows.png";
import celebritiesRow from "@/assets/celebrities-row.png";

export function BodyTypesSection() {
  return (
    <section className="py-24 bg-card overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4">
            The 12 Forces
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Every Body Tells A Story
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each of the 12 body types maps to a force of nature. See the patterns for yourself.
          </p>
        </motion.div>

        {/* Body type names with arrows */}
        <motion.img
          src={bodyTypesArrows}
          alt="12 body types — Lava, Fire, Whirlwind, Snow, Lightning, Sun, Lake, Ocean, Tree, Soil, Mountain, River"
          className="w-full max-w-5xl mx-auto mb-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        />

        {/* Celebrity examples row */}
        <motion.img
          src={celebritiesRow}
          alt="Celebrity examples of the 12 Creator body types"
          className="w-full max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        />
      </div>
    </section>
  );
}
