import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-primary">13</span>
            <span className="text-lg font-display font-semibold">Creators</span>
          </div>
          <div className="flex gap-6 text-sm opacity-80">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#tiers" className="hover:text-primary transition-colors">Pricing</a>
            <Link to="/auth" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
          <p className="text-xs opacity-60">
            © {new Date().getFullYear()} 13 Creators. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
