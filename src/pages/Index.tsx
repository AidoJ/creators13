import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { BodySection } from "@/components/landing/BodySection";
import { LevelsSection } from "@/components/landing/LevelsSection";
import { ComingSoonSection } from "@/components/landing/ComingSoonSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <BodySection />
      <LevelsSection />
      <ComingSoonSection />
      <Footer />
    </div>
  );
};

export default Index;
