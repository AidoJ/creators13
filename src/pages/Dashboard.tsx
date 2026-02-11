import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-primary">13</span>
            <span className="text-lg font-display font-semibold text-foreground">Creators</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Your dashboard is being built. More features coming soon.</p>
      </main>
    </div>
  );
}
