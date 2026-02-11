import { motion } from "framer-motion";
import bodyTemplate from "@/assets/body-template.png";
import bodyComeAlive from "@/assets/body-come-alive.png";
import bodySide from "@/assets/body-side.png";
import whatsInBody1 from "@/assets/whats-in-body-1.png";
import whatsInBody2 from "@/assets/whats-in-body-2.png";
import whatsInBody3 from "@/assets/whats-in-body-3.png";
import whatsInBody4 from "@/assets/whats-in-body-4.png";

export function BodySection() {
  return (
    <section className="bg-card">
      {/* Your Body Is Your Template */}
      <div className="py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl" />
              <img
                src={bodyTemplate}
                alt="Body as template for creation"
                className="relative w-full rounded-2xl shadow-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4">
                The Mirror Principle
              </p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-8 leading-tight">
                Your Body Is Your
                <span className="text-primary"> Template</span> For Creation
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>You have a body, but do you have the user manual for your specific model?</p>
                <p>The shape, structure, and features of your body form the template for everything you create.</p>
              </div>
              <div className="flex gap-6 mt-8">
                {["It's Physical", "It's Real", "It's In The Mirror"].map((text) => (
                  <span key={text} className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Make Your Body Come Alive */}
      <div className="py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4">
                The User Manual
              </p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-8 leading-tight">
                Make Your Body
                <span className="text-primary"> Come Alive</span>
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>When you know how to operate your vehicle, you can create whatever your heart desires.</p>
                <p>The body's template mirrors the patterns in nature — bone structure, weight distribution, and facial features all tell a story.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-4 justify-center"
            >
              <img src={bodyComeAlive} alt="Body blueprint analysis" className="w-[45%] rounded-2xl shadow-xl object-cover" />
              <img src={bodySide} alt="Body side profile" className="w-[45%] rounded-2xl shadow-xl object-cover" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* What's To See In A Body */}
      <div className="py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-4">
              Body Reading
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              What's To See In A Body?
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              {["Bone Structure", "Weight Distribution", "Facial Features"].map((item) => (
                <span key={item} className="text-sm font-semibold text-foreground border border-border px-5 py-2.5 rounded-full">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground italic mt-4">
              Hint: The body's template mirrors the patterns in nature
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[whatsInBody1, whatsInBody2, whatsInBody3, whatsInBody4].map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt={`Body profiling example ${i + 1}`}
                className="w-full aspect-square object-cover rounded-2xl shadow-lg hover:scale-[1.03] transition-transform duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
