import { motion } from "framer-motion";
import { Leaf, Mountain, Sun, Waves, TreePine, Wind, Flame, Snowflake, Cloud, Zap, Moon, Flower2, Gem } from "lucide-react";

const creatorTypes = [
  { name: "River", icon: Waves },
  { name: "Tree", icon: TreePine },
  { name: "Sun", icon: Sun },
  { name: "Mountain", icon: Mountain },
  { name: "Wind", icon: Wind },
  { name: "Flame", icon: Flame },
  { name: "Snow", icon: Snowflake },
  { name: "Cloud", icon: Cloud },
  { name: "Lightning", icon: Zap },
  { name: "Moon", icon: Moon },
  { name: "Flower", icon: Flower2 },
  { name: "Earth", icon: Leaf },
  { name: "Crystal", icon: Gem },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            The 13 Forces of Nature
          </h2>
          <p className="text-lg text-muted-foreground">
            Every person carries a unique combination of natural archetypes — forces that shape 
            how you think, move, create, and connect. Through expert profiling of your physical 
            and energetic blueprint, we reveal the Creator Types within you.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 max-w-4xl mx-auto">
          {creatorTypes.map((type, i) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card hover:bg-primary/10 transition-colors cursor-default"
            >
              <type.icon className="h-8 w-8 text-primary" />
              <span className="text-xs font-medium text-foreground">{type.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
