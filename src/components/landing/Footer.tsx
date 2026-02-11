import aharaPhoto from "@/assets/ahara-photo.jpg";
import footerBg from "@/assets/footer-bg.png";

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Footer background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/80" />

      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
            {/* A'HaRa info */}
            <div className="text-center md:text-left">
              <p className="text-xl font-display text-white mb-1">Create & Come Alive</p>
              <p className="text-lg text-white/80 mb-6">
                with <span className="text-[hsl(0,100%,60%)]">C</span>
                <span className="text-[hsl(30,100%,60%)]">R</span>
                <span className="text-[hsl(120,80%,50%)]">E</span>
                <span className="text-[hsl(280,100%,60%)]">A</span>
                <span className="text-[hsl(50,100%,60%)]">T</span>
                <span className="text-[hsl(200,100%,60%)]">O</span>
                <span className="text-[hsl(0,100%,60%)]">R</span>
                {" "}TYPES
              </p>

              <div className="space-y-1 text-sm text-white/70">
                <p><span className="text-white font-semibold">FULL NAME:</span> A'HaRa</p>
                <p><span className="text-white font-semibold">CREATOR BLUEPRINT:</span> Lava/Whirlwind/Tree/Mountain</p>
                <p><span className="text-white font-semibold">MISSION:</span> To exit the sim we are in</p>
                <p><span className="text-white font-semibold">KNOWN FOR:</span> Blueprinting bodies, inner earth transmissions, timeline jumps, cosmic chats</p>
                <p><span className="text-white font-semibold">CURRENT LOCATION:</span> Victoria, Australia</p>
              </div>

              <div className="mt-6">
                <a
                  href="http://www.creatortypes.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 font-display font-semibold transition-colors"
                >
                  Creator Types For Business →
                </a>
              </div>

              <p className="text-xs text-white/40 mt-4">
                <a href="http://www.earthdreaming.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">
                  Photos by Earth Dreaming
                </a>
              </p>
            </div>

            {/* A'HaRa photo */}
            <div className="flex justify-center">
              <img
                src={aharaPhoto}
                alt="A'HaRa - Creator Types founder"
                className="w-64 h-64 object-cover rounded-full shadow-xl border-4 border-primary/30"
              />
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-6 text-center">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Creator Types. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
