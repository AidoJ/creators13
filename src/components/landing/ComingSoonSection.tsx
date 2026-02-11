import { motion } from "framer-motion";
import { Users, Gamepad2, ShoppingBag } from "lucide-react";

const sections = [
  {
    title: "Community",
    description: "Connect with fellow Creator Types. Share insights, ask questions, and grow together.",
    icon: Users,
  },
  {
    title: "Golden Games",
    description: "Gamified challenges and interactive experiences to deepen your understanding.",
    icon: Gamepad2,
  },
  {
    title: "Shop",
    description: "Physical and digital products to support your Creator Type journey.",
    icon: ShoppingBag,
  },
];

export function ComingSoonSection() {
  return (
    <section id="coming-soon" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Coming Soon
          </h2>
          <p className="text-lg text-muted-foreground">
            More branches of the Creator Types ecosystem are on their way.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-8 rounded-2xl bg-card border border-border"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <s.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
