import { Link } from "react-router-dom";
import aharaPhoto from "@/assets/ahara-photo.jpg";

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto mb-16">
          {/* A'HaRa info */}
          <div>
            <p className="text-primary font-body text-sm font-semibold uppercase tracking-[0.3em] mb-6">
              The Founder
            </p>
            <h3 className="text-3xl font-display font-bold text-white mb-6">A'HaRa</h3>
            <div className="space-y-2 text-sm text-white/60">
              <p><span className="text-white/90 font-semibold">Creator Blueprint:</span> Lava / Whirlwind / Tree / Mountain</p>
              <p><span className="text-white/90 font-semibold">Mission:</span> To exit the sim we are in</p>
              <p><span className="text-white/90 font-semibold">Known For:</span> Blueprinting bodies, inner earth transmissions, timeline jumps, cosmic chats</p>
              <p><span className="text-white/90 font-semibold">Location:</span> Victoria, Australia</p>
            </div>
            <div className="mt-6 flex gap-4">
              <a
                href="http://www.creatortypes.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors"
              >
                Creator Types for Business →
              </a>
            </div>
          </div>

          {/* Photo */}
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-accent/20 rounded-2xl blur-xl" />
              <img
                src={aharaPhoto}
                alt="A'HaRa — Creator Types founder"
                className="relative w-56 h-56 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-primary">13</span>
            <span className="text-lg font-display font-semibold text-white">Creators</span>
          </div>
          <div className="flex gap-8 text-sm text-white/50">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#tiers" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Creator Types. All rights reserved.
            <span className="ml-2">
              <a href="http://www.earthdreaming.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-white/50">
                Photos by Earth Dreaming
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
