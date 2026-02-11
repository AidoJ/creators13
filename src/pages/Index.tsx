import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { TiersSection } from "@/components/landing/TiersSection";
import { ComingSoonSection } from "@/components/landing/ComingSoonSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <TiersSection />
      <ComingSoonSection />
      <Footer />
    </div>
  );
};

export default Index;
