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
    <section>
      {/* Your Body Is Your Template */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img src={bodyTemplate} alt="Body as template for creation" className="w-full max-w-md mx-auto rounded-2xl shadow-lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center md:text-left"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                Your Body Is<br />
                Your Template<br />
                For Creation
              </h2>
              <p className="text-2xl font-display text-primary font-semibold mb-2">It's Physical</p>
              <p className="text-2xl font-display text-primary font-semibold mb-2">It's Real</p>
              <p className="text-2xl font-display text-primary font-semibold">It's In The Mirror</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Make Your Body Come Alive */}
      <div className="bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight text-center md:text-left">
                Make<br />Your<br />Body<br />Come<br />Alive
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>You have a body, but do you have the user manual for your specific model?</p>
                <p>The shape, structure and features of your body form the template for everything you create.</p>
                <p>When you know how to operate your vehicle, you can create whatever your heart desires.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 flex gap-4 justify-center"
            >
              <img src={bodyComeAlive} alt="Body blueprint" className="w-1/2 max-w-[200px] rounded-xl shadow-lg" />
              <img src={bodySide} alt="Body side view" className="w-1/2 max-w-[200px] rounded-xl shadow-lg" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* What's To See In A Body */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              What's To See In A Body?
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <span className="text-xl font-display text-primary font-semibold">Bone Structure</span>
              <span className="text-xl text-muted-foreground">•</span>
              <span className="text-xl font-display text-primary font-semibold">Weight Distribution</span>
              <span className="text-xl text-muted-foreground">•</span>
              <span className="text-xl font-display text-primary font-semibold">Facial Features</span>
            </div>
            <p className="text-lg text-muted-foreground italic mb-10">
              Hint: The body's template mirrors the patterns in nature
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[whatsInBody1, whatsInBody2, whatsInBody3, whatsInBody4].map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt={`Body profiling example ${i + 1}`}
                className="w-full rounded-xl shadow-md"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
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
