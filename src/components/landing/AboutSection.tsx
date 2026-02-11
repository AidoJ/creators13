import { motion } from "framer-motion";
import sandDivider from "@/assets/sand-divider.png";
import iconsRow1 from "@/assets/icons-row-1.png";
import iconsRow2 from "@/assets/icons-row-2.png";
import iconsRow3 from "@/assets/icons-row-3.png";
import creatorTypesIcons from "@/assets/creator-types-icons.png";

export function AboutSection() {
  return (
    <section id="about">
      {/* Sand divider */}
      <div className="w-full">
        <img src={sandDivider} alt="" className="w-full h-auto" />
      </div>

      {/* Meet Your Co-Creators */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-foreground mb-8"
          >
            Want To Meet Your Co-Creators?
          </motion.h2>

          {/* Icon rows */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <img src={iconsRow1} alt="Creator type icons" className="w-full max-w-2xl" />
            <img src={iconsRow2} alt="Creator type icons" className="w-full max-w-2xl" />
            <img src={iconsRow3} alt="Creator type icons" className="w-full max-w-2xl" />
          </div>

          {/* YouTube embed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-lg mb-8"
          >
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/N_hAuOoWFjM"
              title="12 CREATOR TYPES In 12 Minutes"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </motion.div>
        </div>
      </div>

      {/* 12 Body Types */}
      <div className="bg-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src={creatorTypesIcons} alt="12 Creator Types icons" className="w-full max-w-3xl mx-auto mb-10" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              12 BODY TYPES
            </h2>
            <p className="text-2xl md:text-3xl font-display text-primary mb-2">
              = 12 Forces of Nature
            </p>
            <p className="text-2xl md:text-3xl font-display text-primary mb-8">
              = Unlimited Creative Power!
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Doors open soon to the Creator Types ecosystem — The only place online where you can meet other Creators by their body type
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
