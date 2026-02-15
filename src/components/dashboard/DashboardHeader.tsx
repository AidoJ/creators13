import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logo from "@/assets/13creators-logo.png";

interface DashboardHeaderProps {
  email?: string;
  onSignOut: () => void;
}

export default function DashboardHeader({ email, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="13 Creators" className="h-7" />
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={onSignOut}>
            <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
