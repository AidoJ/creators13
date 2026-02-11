import { motion } from "framer-motion";
import creatorTypesIcons from "@/assets/creator-types-icons.png";
import sandDivider from "@/assets/sand-divider.png";
import decorativeElements from "@/assets/decorative-elements.png";

export function AboutSection() {
  return (
    <section id="about">
      {/* Sand divider with icons */}
      <div className="relative">
        <img src={sandDivider} alt="" className="w-full" />
      </div>

      {/* Want To Meet Your Co-Creators */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src={decorativeElements} alt="" className="w-20 mx-auto mb-6 opacity-70" />
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Want To Meet Your Co-Creators?
            </h2>
            <img src={decorativeElements} alt="" className="w-20 mx-auto mt-6 opacity-70" />
          </motion.div>
        </div>
      </div>

      {/* YouTube embed */}
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/N_hAuOoWFjM"
                title="13 CREATOR TYPES In 12 Minutes"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* 13 Body Types = 13 Forces of Nature */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src={creatorTypesIcons} alt="The 13 Creator Type archetypes" className="w-full max-w-4xl mx-auto mb-10" />
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-relaxed">
              <span className="text-primary">13 BODY TYPES</span>
              <br />
              = 13 Forces of Nature
              <br />
              = Unlimited Creative Power!
            </h2>
            <p className="text-lg text-muted-foreground mt-8 max-w-2xl mx-auto">
              Doors open soon to the Creator Types ecosystem —
              <br />
              The only place online where you can meet other Creators by their body type
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
